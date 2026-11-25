using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class ReceiptService : IReceiptService
{
    private readonly IReceiptRepository _receiptRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<ReceiptQueryDto> _queryValidator;
    private readonly IValidator<CreateReceiptRequestDto> _createValidator;

    public ReceiptService(
        IReceiptRepository receiptRepository,
        IWarehouseRepository warehouseRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<ReceiptQueryDto> queryValidator,
        IValidator<CreateReceiptRequestDto> createValidator)
    {
        _receiptRepository = receiptRepository;
        _warehouseRepository = warehouseRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _createValidator = createValidator;
    }

    public async Task<PagedResult<ReceiptDto>> GetReceiptsAsync(
        ReceiptQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        return await _receiptRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<ReceiptDto> GetReceiptByIdAsync(
        long receiptId,
        CancellationToken cancellationToken = default)
    {
        return await _receiptRepository.GetDtoByIdAsync(receiptId, cancellationToken)
            ?? throw new NotFoundException("InventoryReceipt", receiptId);
    }

    public async Task<ReceiptDto> CreateReceiptAsync(
        CreateReceiptRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var currentUserId = RequireCurrentUserId();

        var warehouse = await _warehouseRepository.GetByIdAsync(request.WarehouseId, cancellationToken)
            ?? throw new NotFoundException("Warehouse", request.WarehouseId);

        if (!warehouse.IsActive)
        {
            throw new BusinessException(ErrorCodes.BusinessRuleViolation, "Kho này hiện đang ngừng hoạt động.", 409);
        }

        if (request.ReceiptType == ReceiptTypes.SellerInbound && request.SenderSellerId.HasValue)
        {
            var sellerExists = await _warehouseRepository.SellerExistsAsync(request.SenderSellerId.Value, cancellationToken);
            if (!sellerExists)
            {
                throw new NotFoundException("Seller", request.SenderSellerId.Value);
            }
        }

        foreach (var line in request.Details)
        {
            var location = await _warehouseRepository.GetLocationByIdAsync(line.LocationId, cancellationToken)
                ?? throw new NotFoundException("WarehouseLocation", line.LocationId);

            if (location.WarehouseId != warehouse.WarehouseId || !location.IsActive)
            {
                throw new BusinessException(
                    ErrorCodes.InvalidLocation,
                    $"Vị trí kệ #{line.LocationId} không thuộc kho '{warehouse.WarehouseName}' hoặc đang ngừng sử dụng.",
                    400);
            }

            var variantExists = await _receiptRepository.VariantExistsAsync(line.VariantId, cancellationToken);
            if (!variantExists)
            {
                throw new NotFoundException("ProductVariant", line.VariantId);
            }

            var variantSellerId = await _receiptRepository.GetVariantSellerIdAsync(line.VariantId, cancellationToken);
            if (warehouse.WarehouseType == WarehouseTypes.Seller &&
                warehouse.OwnerSellerId.HasValue &&
                variantSellerId != warehouse.OwnerSellerId.Value)
            {
                throw new BusinessException(
                    ErrorCodes.BusinessRuleViolation,
                    $"Kho riêng của Seller chỉ được chứa hàng thuộc sở hữu của Seller #{warehouse.OwnerSellerId.Value}.",
                    409);
            }

            if (request.ReceiptType == ReceiptTypes.SellerInbound &&
                request.SenderSellerId.HasValue &&
                variantSellerId != request.SenderSellerId.Value)
            {
                throw new BusinessException(
                    ErrorCodes.BusinessRuleViolation,
                    $"Biến thể #{line.VariantId} không thuộc về Seller gửi hàng #{request.SenderSellerId.Value}.",
                    409);
            }
        }

        var receipt = new InventoryReceipt
        {
            WarehouseId = warehouse.WarehouseId,
            ReceiptType = request.ReceiptType,
            SenderSellerId = request.ReceiptType == ReceiptTypes.SellerInbound ? request.SenderSellerId : null,
            TransferId = request.ReceiptType == ReceiptTypes.TransferInbound ? request.TransferId : null,
            ReturnRequestId = request.ReceiptType == ReceiptTypes.CustomerReturn ? request.ReturnRequestId : null,
            ReceiptCode = GenerateReceiptCode(),
            Status = ReceiptStatuses.Draft,
            Note = request.Note?.Trim(),
            CreatedBy = currentUserId,
            CreatedAt = DateTime.UtcNow,
            Details = request.Details.Select(d => new ReceiptDetail
            {
                WarehouseId = warehouse.WarehouseId,
                VariantId = d.VariantId,
                LocationId = d.LocationId,
                Quantity = d.Quantity,
                UnitCost = d.UnitCost
            }).ToList()
        };

        await _receiptRepository.AddAsync(receipt, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _receiptRepository.GetDtoByIdAsync(receipt.ReceiptId, cancellationToken)
            ?? throw new NotFoundException("InventoryReceipt", receipt.ReceiptId);
    }

    public async Task<ReceiptDto> ConfirmReceiptAsync(
        long receiptId,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = RequireCurrentUserId();

        var receipt = await _receiptRepository.GetByIdWithDetailsAsync(receiptId, cancellationToken)
            ?? throw new NotFoundException("InventoryReceipt", receiptId);

        if (receipt.Status != ReceiptStatuses.Draft)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể xác nhận phiếu nhập ở trạng thái Draft (hiện tại: {receipt.Status}).",
                409);
        }

        if (receipt.CreatedBy == currentUserId)
        {
            throw new BusinessException(
                ErrorCodes.SelfApprovalNotAllowed,
                "Người tạo phiếu nhập không được tự xác nhận chính phiếu đó.",
                409);
        }

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            receipt.Status = ReceiptStatuses.Confirmed;
            receipt.ConfirmedBy = currentUserId;
            receipt.ConfirmedAt = DateTime.UtcNow;

            var movementType = receipt.ReceiptType == ReceiptTypes.CustomerReturn
                ? StockMovementTypes.ReturnIn
                : StockMovementTypes.Receipt;

            foreach (var detail in receipt.Details)
            {
                await _inventoryLedgerService.IncreaseOnHandAsync(
                    receipt.WarehouseId,
                    detail.LocationId,
                    detail.VariantId,
                    detail.Quantity,
                    movementType,
                    StockReferenceTypes.Receipt,
                    receipt.ReceiptId,
                    currentUserId,
                    $"Xác nhận phiếu nhập {receipt.ReceiptCode}",
                    ct);
            }

            _receiptRepository.Update(receipt);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _receiptRepository.GetDtoByIdAsync(receipt.ReceiptId, cancellationToken)
            ?? throw new NotFoundException("InventoryReceipt", receipt.ReceiptId);
    }

    public async Task<ReceiptDto> CancelReceiptAsync(
        long receiptId,
        CancellationToken cancellationToken = default)
    {
        RequireCurrentUserId();

        var receipt = await _receiptRepository.GetByIdWithDetailsAsync(receiptId, cancellationToken)
            ?? throw new NotFoundException("InventoryReceipt", receiptId);

        if (receipt.Status != ReceiptStatuses.Draft)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Không thể hủy phiếu nhập ở trạng thái '{receipt.Status}'. Chỉ phiếu Draft mới được hủy.",
                409);
        }

        receipt.Status = ReceiptStatuses.Cancelled;
        _receiptRepository.Update(receipt);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _receiptRepository.GetDtoByIdAsync(receipt.ReceiptId, cancellationToken)
            ?? throw new NotFoundException("InventoryReceipt", receipt.ReceiptId);
    }

    private long RequireCurrentUserId()
    {
        return _currentUser.UserId ?? throw BusinessException.Unauthorized();
    }

    private static string GenerateReceiptCode()
    {
        var stamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var suffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"PN-{stamp}-{suffix}";
    }
}
