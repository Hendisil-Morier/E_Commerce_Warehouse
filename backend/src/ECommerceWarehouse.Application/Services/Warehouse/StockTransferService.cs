using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class StockTransferService : IStockTransferService
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<CreateStockTransferRequestDto> _createValidator;
    private readonly IValidator<ReceiveStockTransferRequestDto> _receiveValidator;

    public StockTransferService(
        IStockTransferRepository transferRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<CreateStockTransferRequestDto> createValidator,
        IValidator<ReceiveStockTransferRequestDto> receiveValidator)
    {
        _transferRepository = transferRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _createValidator = createValidator;
        _receiveValidator = receiveValidator;
    }

    public Task<PagedResult<StockTransferListItemDto>> GetStockTransfersAsync(
        StockTransferQueryDto query,
        CancellationToken cancellationToken = default)
        => _transferRepository.GetPagedAsync(query, cancellationToken);

    public async Task<StockTransferDetailDto> GetByIdAsync(long transferId, CancellationToken cancellationToken = default)
        => await _transferRepository.GetDetailDtoAsync(transferId, cancellationToken)
            ?? throw new NotFoundException("StockTransfer", transferId);

    public async Task<StockTransferDetailDto> CreateAsync(
        CreateStockTransferRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        if (!await _transferRepository.WarehouseExistsAsync(request.SourceWarehouseId, cancellationToken))
        {
            throw new NotFoundException("Warehouse", request.SourceWarehouseId);
        }

        if (!await _transferRepository.WarehouseExistsAsync(request.DestinationWarehouseId, cancellationToken))
        {
            throw new NotFoundException("Warehouse", request.DestinationWarehouseId);
        }

        if (request.Items.Any(i => i.SourceLocationId == i.DestinationLocationId))
        {
            throw new BusinessException(
                ErrorCodes.ValidationError,
                "Vị trí nguồn và vị trí đích không được trùng nhau.",
                400);
        }

        var sourceLocIds = request.Items.Select(i => i.SourceLocationId).Distinct().ToList();
        var validSourceLocs = await _transferRepository.GetValidLocationIdsInWarehouseAsync(
            request.SourceWarehouseId, sourceLocIds, cancellationToken);
        var missingSource = sourceLocIds.FirstOrDefault(id => !validSourceLocs.Contains(id));
        if (missingSource != 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Vị trí nguồn #{missingSource} không thuộc kho #{request.SourceWarehouseId}.",
                400);
        }

        var destLocIds = request.Items.Select(i => i.DestinationLocationId).Distinct().ToList();
        var validDestLocs = await _transferRepository.GetValidLocationIdsInWarehouseAsync(
            request.DestinationWarehouseId, destLocIds, cancellationToken);
        var missingDest = destLocIds.FirstOrDefault(id => !validDestLocs.Contains(id));
        if (missingDest != 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Vị trí đích #{missingDest} không thuộc kho #{request.DestinationWarehouseId}.",
                400);
        }

        var variantIds = request.Items.Select(i => i.VariantId).Distinct().ToList();
        var validVariants = await _transferRepository.GetValidVariantIdsAsync(variantIds, cancellationToken);
        var missingVar = variantIds.FirstOrDefault(id => !validVariants.Contains(id));
        if (missingVar != 0)
        {
            throw new NotFoundException("ProductVariant", missingVar);
        }

        var now = DateTime.UtcNow;
        var transfer = new StockTransfer
        {
            SourceWarehouseId = request.SourceWarehouseId,
            DestinationWarehouseId = request.DestinationWarehouseId,
            TransferCode = $"TRF-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}",
            Status = StockTransferStatuses.Draft,
            Note = request.Note?.Trim(),
            CreatedBy = userId,
            CreatedAt = now,
            Details = request.Items.Select(i => new StockTransferDetail
            {
                VariantId = i.VariantId,
                SourceLocationId = i.SourceLocationId,
                DestinationLocationId = i.DestinationLocationId,
                Quantity = i.Quantity
            }).ToList()
        };

        await _transferRepository.AddAsync(transfer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(transfer.TransferId, cancellationToken);
    }

    public async Task<StockTransferDetailDto> ApproveAsync(long transferId, CancellationToken cancellationToken = default)
    {
        var managerId = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var transfer = await _transferRepository.GetByIdWithDetailsAsync(transferId, cancellationToken)
            ?? throw new NotFoundException("StockTransfer", transferId);

        if (transfer.Status != StockTransferStatuses.Draft)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể duyệt phiếu điều chuyển ở trạng thái Draft (hiện tại: '{transfer.Status}').",
                409);
        }

        transfer.Status = StockTransferStatuses.Approved;
        transfer.ApprovedBy = managerId;
        transfer.ApprovedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(transfer.TransferId, cancellationToken);
    }

    public async Task<StockTransferDetailDto> DispatchAsync(long transferId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var transfer = await _transferRepository.GetByIdWithDetailsAsync(transferId, cancellationToken)
            ?? throw new NotFoundException("StockTransfer", transferId);

        if (transfer.Status != StockTransferStatuses.Approved)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể xuất điều chuyển khi phiếu ở trạng thái Approved (hiện tại: '{transfer.Status}').",
                409);
        }

        var now = DateTime.UtcNow;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var detail in transfer.Details)
            {
                await _inventoryLedgerService.AdjustOnHandAsync(
                    transfer.SourceWarehouseId,
                    detail.SourceLocationId,
                    detail.VariantId,
                    -detail.Quantity,
                    StockMovementTypes.TransferOut,
                    StockReferenceTypes.Transfer,
                    transfer.TransferId,
                    userId,
                    $"Xuất điều chuyển {transfer.TransferCode}",
                    ct);
            }

            transfer.Status = StockTransferStatuses.InTransit;
            transfer.ShippedAt = now;

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await GetByIdAsync(transfer.TransferId, cancellationToken);
    }

    public async Task<StockTransferDetailDto> ReceiveAsync(
        long transferId,
        ReceiveStockTransferRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _receiveValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = _currentUser.UserId ?? throw BusinessException.Unauthorized();

        var transfer = await _transferRepository.GetByIdWithDetailsAsync(transferId, cancellationToken)
            ?? throw new NotFoundException("StockTransfer", transferId);

        if (transfer.Status != StockTransferStatuses.InTransit)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể nhận hàng điều chuyển khi phiếu ở trạng thái InTransit (hiện tại: '{transfer.Status}').",
                409);
        }

        var detailMap = transfer.Details.ToDictionary(d => d.TransferDetailId);
        var overrideDestLocs = request.Items
            .Where(i => i.DestinationLocationId.HasValue)
            .Select(i => i.DestinationLocationId!.Value)
            .Distinct()
            .ToList();

        if (overrideDestLocs.Count > 0)
        {
            var validDestLocs = await _transferRepository.GetValidLocationIdsInWarehouseAsync(
                transfer.DestinationWarehouseId, overrideDestLocs, cancellationToken);
            var missingDest = overrideDestLocs.FirstOrDefault(id => !validDestLocs.Contains(id));
            if (missingDest != 0)
            {
                throw new BusinessException(
                    ErrorCodes.BusinessRuleViolation,
                    $"Vị trí nhận #{missingDest} không thuộc kho đích #{transfer.DestinationWarehouseId}.",
                    400);
            }
        }

        var now = DateTime.UtcNow;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var item in request.Items)
            {
                if (!detailMap.TryGetValue(item.TransferDetailId, out var detail))
                {
                    throw new NotFoundException("StockTransferDetail", item.TransferDetailId);
                }

                if (item.ReceivedQuantity > detail.Quantity)
                {
                    throw new BusinessException(
                        ErrorCodes.ValidationError,
                        $"Số lượng nhận ({item.ReceivedQuantity}) không được vượt quá số lượng xuất ({detail.Quantity}).",
                        400);
                }

                var targetLocationId = item.DestinationLocationId ?? detail.DestinationLocationId
                    ?? throw new BusinessException(ErrorCodes.ValidationError, "Thiếu vị trí đích nhận hàng.", 400);

                detail.DestinationLocationId = targetLocationId;
                detail.ReceivedQuantity = item.ReceivedQuantity;

                await _inventoryLedgerService.IncreaseOnHandAsync(
                    transfer.DestinationWarehouseId,
                    targetLocationId,
                    detail.VariantId,
                    item.ReceivedQuantity,
                    StockMovementTypes.TransferIn,
                    StockReferenceTypes.Transfer,
                    transfer.TransferId,
                    userId,
                    $"Nhận điều chuyển {transfer.TransferCode}",
                    ct);
            }

            if (transfer.Details.Any(d => !d.ReceivedQuantity.HasValue))
            {
                throw new BusinessException(
                    ErrorCodes.BusinessRuleViolation,
                    "Phải xác nhận số lượng nhận cho tất cả các dòng điều chuyển.",
                    400);
            }

            transfer.Status = StockTransferStatuses.Received;
            transfer.ReceivedBy = userId;
            transfer.ReceivedAt = now;

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await GetByIdAsync(transfer.TransferId, cancellationToken);
    }

    public async Task<StockTransferDetailDto> CancelAsync(long transferId, CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw BusinessException.Unauthorized();
        var transfer = await _transferRepository.GetByIdWithDetailsAsync(transferId, cancellationToken)
            ?? throw new NotFoundException("StockTransfer", transferId);

        if (transfer.Status is StockTransferStatuses.InTransit or StockTransferStatuses.Received or StockTransferStatuses.Cancelled)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể hủy phiếu điều chuyển ở trạng thái '{transfer.Status}'.",
                409);
        }

        transfer.Status = StockTransferStatuses.Cancelled;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(transfer.TransferId, cancellationToken);
    }
}
