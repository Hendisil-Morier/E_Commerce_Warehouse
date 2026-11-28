using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class StockCountService : IStockCountService
{
    private readonly IStockCountRepository _stockCountRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<CreateStockCountRequestDto> _createValidator;
    private readonly IValidator<RecordStockCountRequestDto> _recordValidator;

    public StockCountService(
        IStockCountRepository stockCountRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<CreateStockCountRequestDto> createValidator,
        IValidator<RecordStockCountRequestDto> recordValidator)
    {
        _stockCountRepository = stockCountRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _createValidator = createValidator;
        _recordValidator = recordValidator;
    }

    public Task<PagedResult<StockCountListItemDto>> GetStockCountsAsync(
        StockCountQueryDto query,
        CancellationToken cancellationToken = default)
        => _stockCountRepository.GetPagedAsync(query, cancellationToken);

    public async Task<StockCountDetailDto> GetByIdAsync(long stockCountId, CancellationToken cancellationToken = default)
        => await _stockCountRepository.GetDetailDtoAsync(stockCountId, cancellationToken)
            ?? throw new NotFoundException("StockCount", stockCountId);

    public async Task<StockCountDetailDto> CreateAsync(
        CreateStockCountRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        if (!await _stockCountRepository.WarehouseExistsAsync(request.WarehouseId, cancellationToken))
        {
            throw new NotFoundException("Warehouse", request.WarehouseId);
        }

        var distinctPairs = request.Items
            .Select(i => (i.LocationId, i.VariantId))
            .Distinct()
            .ToList();

        if (distinctPairs.Count != request.Items.Count)
        {
            throw new BusinessException(
                ErrorCodes.ValidationError,
                "Không được trùng cặp vị trí và biến thể trong cùng phiếu kiểm kê.",
                400);
        }

        var locationIds = distinctPairs.Select(p => p.LocationId).Distinct().ToList();
        var validLocations = await _stockCountRepository.GetValidLocationIdsInWarehouseAsync(
            request.WarehouseId, locationIds, cancellationToken);

        var missingLoc = locationIds.FirstOrDefault(id => !validLocations.Contains(id));
        if (missingLoc != 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Vị trí #{missingLoc} không tồn tại hoặc không thuộc kho #{request.WarehouseId}.",
                400);
        }

        var variantIds = distinctPairs.Select(p => p.VariantId).Distinct().ToList();
        var validVariants = await _stockCountRepository.GetValidVariantIdsAsync(variantIds, cancellationToken);
        var missingVar = variantIds.FirstOrDefault(id => !validVariants.Contains(id));
        if (missingVar != 0)
        {
            throw new NotFoundException("ProductVariant", missingVar);
        }

        var systemQuantities = await _stockCountRepository.GetSystemQuantitiesAsync(
            request.WarehouseId, distinctPairs, cancellationToken);

        var now = DateTime.UtcNow;
        var count = new StockCount
        {
            WarehouseId = request.WarehouseId,
            CountCode = $"CNT-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}",
            Status = StockCountStatuses.Draft,
            Note = request.Note?.Trim(),
            CreatedBy = userId,
            CreatedAt = now,
            Details = distinctPairs.Select(p => new StockCountDetail
            {
                WarehouseId = request.WarehouseId,
                LocationId = p.LocationId,
                VariantId = p.VariantId,
                SystemQuantity = systemQuantities.GetValueOrDefault(p, 0)
            }).ToList()
        };

        await _stockCountRepository.AddAsync(count, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(count.StockCountId, cancellationToken);
    }

    public async Task<StockCountDetailDto> RecordAsync(
        long stockCountId,
        RecordStockCountRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _recordValidator.ValidateAndThrowAsync(request, cancellationToken);
        _ = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var count = await _stockCountRepository.GetByIdWithDetailsAsync(stockCountId, cancellationToken)
            ?? throw new NotFoundException("StockCount", stockCountId);

        if (count.Status != StockCountStatuses.Draft && count.Status != StockCountStatuses.Counting)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể nhập kết quả kiểm kê ở trạng thái '{count.Status}'.",
                409);
        }

        var detailMap = count.Details.ToDictionary(d => d.StockCountDetailId);
        foreach (var item in request.Items)
        {
            if (!detailMap.TryGetValue(item.StockCountDetailId, out var detail))
            {
                throw new NotFoundException("StockCountDetail", item.StockCountDetailId);
            }

            detail.CountedQuantity = item.CountedQuantity;
            detail.Reason = item.Reason?.Trim();
        }

        if (request.SubmitForApproval)
        {
            if (count.Details.Any(d => !d.CountedQuantity.HasValue))
            {
                throw new BusinessException(
                    ErrorCodes.BusinessRuleViolation,
                    "Phải nhập số lượng thực tế cho tất cả các dòng trước khi gửi duyệt.",
                    400);
            }
            count.Status = StockCountStatuses.PendingApproval;
        }
        else
        {
            count.Status = StockCountStatuses.Counting;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(count.StockCountId, cancellationToken);
    }

    public async Task<StockCountDetailDto> ApproveAsync(long stockCountId, CancellationToken cancellationToken = default)
    {
        var managerId = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var count = await _stockCountRepository.GetByIdWithDetailsAsync(stockCountId, cancellationToken)
            ?? throw new NotFoundException("StockCount", stockCountId);

        if (count.Status != StockCountStatuses.PendingApproval)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể duyệt phiếu kiểm kê ở trạng thái PendingApproval (hiện tại: '{count.Status}').",
                409);
        }

        var now = DateTime.UtcNow;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var detail in count.Details)
            {
                var counted = detail.CountedQuantity ?? detail.SystemQuantity;
                var delta = counted - detail.SystemQuantity;
                if (delta == 0) continue;

                await _inventoryLedgerService.AdjustOnHandAsync(
                    count.WarehouseId,
                    detail.LocationId,
                    detail.VariantId,
                    delta,
                    StockMovementTypes.StockCount,
                    StockReferenceTypes.StockCount,
                    count.StockCountId,
                    managerId,
                    detail.Reason ?? $"Điều chỉnh theo phiếu kiểm kê {count.CountCode}",
                    ct);
            }

            count.Status = StockCountStatuses.Approved;
            count.ApprovedBy = managerId;
            count.ApprovedAt = now;

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await GetByIdAsync(count.StockCountId, cancellationToken);
    }

    public async Task<StockCountDetailDto> CancelAsync(long stockCountId, CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var count = await _stockCountRepository.GetByIdWithDetailsAsync(stockCountId, cancellationToken)
            ?? throw new NotFoundException("StockCount", stockCountId);

        if (count.Status is StockCountStatuses.Approved or StockCountStatuses.Cancelled)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể hủy phiếu kiểm kê ở trạng thái '{count.Status}'.",
                409);
        }

        count.Status = StockCountStatuses.Cancelled;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(count.StockCountId, cancellationToken);
    }
}
