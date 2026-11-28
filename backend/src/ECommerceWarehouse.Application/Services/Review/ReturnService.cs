using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class ReturnService : IReturnService
{
    private readonly IReturnRepository _returnRepository;
    private readonly IRefundRepository _refundRepository;
    private readonly IInventoryLedgerService _inventoryLedgerService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<ReturnQueryDto> _queryValidator;
    private readonly IValidator<CreateReturnRequestDto> _createValidator;
    private readonly IValidator<RejectReturnRequestDto> _rejectValidator;
    private readonly IValidator<InspectReturnItemRequestDto> _inspectValidator;

    public ReturnService(
        IReturnRepository returnRepository,
        IRefundRepository refundRepository,
        IInventoryLedgerService inventoryLedgerService,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<ReturnQueryDto> queryValidator,
        IValidator<CreateReturnRequestDto> createValidator,
        IValidator<RejectReturnRequestDto> rejectValidator,
        IValidator<InspectReturnItemRequestDto> inspectValidator)
    {
        _returnRepository = returnRepository;
        _refundRepository = refundRepository;
        _inventoryLedgerService = inventoryLedgerService;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _queryValidator = queryValidator;
        _createValidator = createValidator;
        _rejectValidator = rejectValidator;
        _inspectValidator = inspectValidator;
    }

    public async Task<ReturnRequestDto> CreateReturnRequestAsync(
        long sellerOrderId,
        CreateReturnRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);
        var customerId = RequireCurrentUserId();

        var sellerOrder = await _returnRepository.GetSellerOrderForReturnAsync(sellerOrderId, cancellationToken);
        if (sellerOrder == null || sellerOrder.Order.CustomerId != customerId)
        {
            throw new NotFoundException("SellerOrder", sellerOrderId);
        }

        if (sellerOrder.Status != SellerOrderStatuses.Delivered)
        {
            throw new BusinessException(
                ErrorCodes.ReturnNotEligible,
                $"Chỉ có thể yêu cầu trả hàng với đơn đã giao (Delivered). Trạng thái hiện tại: '{sellerOrder.Status}'.",
                409);
        }

        var itemMap = sellerOrder.Items.ToDictionary(i => i.OrderItemId);
        var distinctItemIds = new HashSet<long>();
        var returnItems = new List<ReturnRequestItem>();

        foreach (var reqItem in request.Items)
        {
            if (!distinctItemIds.Add(reqItem.OrderItemId))
            {
                throw new BusinessException(
                    ErrorCodes.ValidationError,
                    $"Dòng hàng #{reqItem.OrderItemId} bị trùng lặp trong yêu cầu trả.",
                    400);
            }

            if (!itemMap.TryGetValue(reqItem.OrderItemId, out var orderItem))
            {
                throw new NotFoundException("OrderItem", reqItem.OrderItemId);
            }

            var alreadyReturned = await _returnRepository.GetAlreadyReturnedQuantityAsync(orderItem.OrderItemId, cancellationToken);
            if (alreadyReturned + reqItem.Quantity > orderItem.Quantity)
            {
                throw new BusinessException(
                    ErrorCodes.ReturnNotEligible,
                    $"Sản phẩm '{orderItem.ProductNameSnapshot}' vượt quá số lượng đã mua (đã mua: {orderItem.Quantity}, đã yêu cầu trả: {alreadyReturned}).",
                    409);
            }

            returnItems.Add(new ReturnRequestItem
            {
                OrderItemId = orderItem.OrderItemId,
                Quantity = reqItem.Quantity,
                InspectionResult = InspectionResults.Pending
            });
        }

        var returnRequest = new ReturnRequest
        {
            RequestCode = $"RT-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            SellerOrderId = sellerOrder.SellerOrderId,
            CustomerId = customerId,
            Reason = request.Reason.Trim(),
            Status = ReturnStatuses.Requested,
            CreatedAt = DateTime.UtcNow,
            Items = returnItems
        };

        await _returnRepository.AddAsync(returnRequest, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _returnRepository.GetDtoByIdAsync(returnRequest.ReturnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", returnRequest.ReturnRequestId);
    }

    public async Task<PagedResult<ReturnRequestDto>> GetReturnsAsync(
        ReturnQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);

        long? customerIdFilter = null;
        long? sellerIdFilter = null;

        var isElevated = _currentUser.IsInRole(RoleNames.Admin)
                         || _currentUser.IsInRole(RoleNames.WarehouseManager)
                         || _currentUser.IsInRole(RoleNames.WarehouseStaff);

        if (!isElevated)
        {
            if (_currentUser.IsInRole(RoleNames.Seller))
            {
                sellerIdFilter = await _currentUser.GetSellerIdAsync(cancellationToken)
                    ?? throw BusinessException.Forbidden("Không tìm thấy hồ sơ Seller.");
            }
            else
            {
                customerIdFilter = RequireCurrentUserId();
            }
        }

        return await _returnRepository.GetPagedAsync(query, customerIdFilter, sellerIdFilter, cancellationToken);
    }

    public async Task<ReturnRequestDto> GetReturnByIdAsync(
        long returnRequestId,
        CancellationToken cancellationToken = default)
    {
        var dto = await _returnRepository.GetDtoByIdAsync(returnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", returnRequestId);

        var isElevated = _currentUser.IsInRole(RoleNames.Admin)
                         || _currentUser.IsInRole(RoleNames.WarehouseManager)
                         || _currentUser.IsInRole(RoleNames.WarehouseStaff);

        if (!isElevated)
        {
            if (_currentUser.IsInRole(RoleNames.Seller))
            {
                var sellerId = await _currentUser.GetSellerIdAsync(cancellationToken);
                if (dto.SellerId != sellerId)
                {
                    throw new NotFoundException("ReturnRequest", returnRequestId);
                }
            }
            else if (dto.CustomerId != RequireCurrentUserId())
            {
                throw new NotFoundException("ReturnRequest", returnRequestId);
            }
        }

        return dto;
    }

    public async Task<ReturnRequestDto> ApproveAsync(
        long returnRequestId,
        CancellationToken cancellationToken = default)
    {
        var userId = RequireCurrentUserId();
        var rr = await _returnRepository.GetByIdWithDetailsAsync(returnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", returnRequestId);

        await EnsureSellerOrAdminAccessAsync(rr, returnRequestId, cancellationToken);

        if (rr.Status != ReturnStatuses.Requested)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể duyệt yêu cầu trả hàng ở trạng thái Requested (hiện tại: '{rr.Status}').",
                409);
        }

        var now = DateTime.UtcNow;
        rr.Status = ReturnStatuses.Approved;
        rr.ReviewedBy = userId;
        rr.ReviewedAt = now;
        rr.UpdatedAt = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _returnRepository.GetDtoByIdAsync(rr.ReturnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", rr.ReturnRequestId);
    }

    public async Task<ReturnRequestDto> RejectAsync(
        long returnRequestId,
        RejectReturnRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _rejectValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireCurrentUserId();

        var rr = await _returnRepository.GetByIdWithDetailsAsync(returnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", returnRequestId);

        await EnsureSellerOrAdminAccessAsync(rr, returnRequestId, cancellationToken);

        if (rr.Status != ReturnStatuses.Requested)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể từ chối yêu cầu trả hàng ở trạng thái Requested (hiện tại: '{rr.Status}').",
                409);
        }

        var now = DateTime.UtcNow;
        rr.Status = ReturnStatuses.Rejected;
        rr.RejectReason = request.Reason.Trim();
        rr.ReviewedBy = userId;
        rr.ReviewedAt = now;
        rr.UpdatedAt = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await _returnRepository.GetDtoByIdAsync(rr.ReturnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", rr.ReturnRequestId);
    }

    public async Task<ReturnRequestDto> ReceiveAsync(
        long returnRequestId,
        ReceiveReturnRequestDto? request,
        CancellationToken cancellationToken = default)
    {
        var userId = RequireCurrentUserId();
        var rr = await _returnRepository.GetByIdWithDetailsAsync(returnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", returnRequestId);

        if (rr.Status != ReturnStatuses.Approved)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ có thể tiếp nhận hàng hoàn khi yêu cầu đã Approved (hiện tại: '{rr.Status}').",
                409);
        }

        var warehouseId = rr.SellerOrder.WarehouseId
            ?? throw new BusinessException(ErrorCodes.BusinessRuleViolation, "Đơn con chưa được gắn kho xuất/nhận hoàn.", 409);

        var returnZone = await _returnRepository.GetReturnZoneLocationAsync(warehouseId, request?.ReturnLocationId, cancellationToken)
            ?? throw new BusinessException(
                ErrorCodes.InvalidLocation,
                "Kho chưa có vị trí khu Hàng trả (StorageType = 'Returns') đang hoạt động.",
                409);

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var item in rr.Items)
            {
                await _inventoryLedgerService.IncreaseOnHandAsync(
                    warehouseId,
                    returnZone.LocationId,
                    item.OrderItem.VariantId,
                    item.Quantity,
                    StockMovementTypes.ReturnIn,
                    StockReferenceTypes.ReturnRequest,
                    rr.ReturnRequestId,
                    userId,
                    $"Nhận hàng hoàn {rr.RequestCode} vào khu {returnZone.LocationCode}",
                    ct);

                item.RestockLocationId = returnZone.LocationId;
            }

            rr.Status = ReturnStatuses.ItemsReceived;
            rr.UpdatedAt = now;

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _returnRepository.GetDtoByIdAsync(rr.ReturnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", rr.ReturnRequestId);
    }

    public async Task<ReturnRequestDto> InspectItemAsync(
        long returnRequestId,
        long returnItemId,
        InspectReturnItemRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _inspectValidator.ValidateAndThrowAsync(request, cancellationToken);
        var userId = RequireCurrentUserId();

        var rr = await _returnRepository.GetByIdWithDetailsAsync(returnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", returnRequestId);

        if (rr.Status != ReturnStatuses.ItemsReceived)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                $"Chỉ được kiểm định khi hàng hoàn đã được tiếp nhận (ItemsReceived). Hiện tại: '{rr.Status}'.",
                409);
        }

        var item = rr.Items.FirstOrDefault(i => i.ReturnItemId == returnItemId)
            ?? throw new NotFoundException("ReturnRequestItem", returnItemId);

        if (item.InspectionResult != InspectionResults.Pending)
        {
            throw new BusinessException(
                ErrorCodes.InvalidStatusTransition,
                "Dòng hàng hoàn này đã được kiểm định trước đó.",
                409);
        }

        var warehouseId = rr.SellerOrder.WarehouseId
            ?? throw new BusinessException(ErrorCodes.BusinessRuleViolation, "Đơn con chưa được gắn kho.", 409);

        var destLocation = await _returnRepository.GetLocationByIdAsync(request.RestockLocationId, cancellationToken)
            ?? throw new NotFoundException("WarehouseLocation", request.RestockLocationId);

        if (destLocation.WarehouseId != warehouseId || !destLocation.IsActive)
        {
            throw new BusinessException(
                ErrorCodes.InvalidLocation,
                "Vị trí đích không thuộc kho hiện tại hoặc đang ngừng sử dụng.",
                400);
        }

        if (destLocation.StorageType == StorageTypes.Inbound || destLocation.StorageType == StorageTypes.Returns)
        {
            throw new BusinessException(
                ErrorCodes.InvalidLocation,
                "Không thể chuyển hàng đã kiểm định vào lại khu Inbound hoặc Returns.",
                400);
        }

        if (request.InspectionResult == InspectionResults.Good && !destLocation.IsSellable)
        {
            throw new BusinessException(
                ErrorCodes.InvalidLocation,
                "Hàng kiểm định đạt (Good) phải chuyển về vị trí kệ bán được (IsSellable = true).",
                400);
        }

        if (request.InspectionResult == InspectionResults.Damaged && destLocation.StorageType != StorageTypes.Damaged)
        {
            throw new BusinessException(
                ErrorCodes.InvalidLocation,
                "Hàng hư hỏng (Damaged) bắt buộc phải chuyển vào khu Damaged.",
                400);
        }

        var sourceReturnLocationId = item.RestockLocationId
            ?? (await _returnRepository.GetReturnZoneLocationAsync(warehouseId, null, cancellationToken))?.LocationId
            ?? throw new BusinessException(ErrorCodes.InvalidLocation, "Không xác định được vị trí khu Returns gốc.", 409);

        var now = DateTime.UtcNow;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _inventoryLedgerService.TransferAdjustmentAsync(
                warehouseId,
                sourceReturnLocationId,
                destLocation.LocationId,
                item.OrderItem.VariantId,
                item.Quantity,
                StockReferenceTypes.ReturnRequest,
                rr.ReturnRequestId,
                userId,
                $"Kiểm định ({request.InspectionResult}) đơn hoàn {rr.RequestCode}",
                ct);

            item.InspectionResult = request.InspectionResult;
            item.InspectionNote = request.InspectionNote?.Trim();
            item.RestockLocationId = destLocation.LocationId;
            item.InspectedBy = userId;
            item.InspectedAt = now;

            // Khi toàn bộ dòng hàng trong yêu cầu trả đã được kiểm định -> chuyển sang Inspected & tạo Refund Pending
            if (rr.Items.All(i => i.InspectionResult != InspectionResults.Pending))
            {
                rr.Status = ReturnStatuses.Inspected;
                rr.UpdatedAt = now;

                var paidPayment = rr.SellerOrder.Order.Payments
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefault(p => p.PaymentStatus == PaymentStatuses.Paid);

                if (paidPayment != null && !await _refundRepository.ExistsForReturnRequestAsync(rr.ReturnRequestId, ct))
                {
                    var lockedPayment = await _refundRepository.GetPaymentForUpdateAsync(paidPayment.PaymentId, ct)
                        ?? paidPayment;

                    var refundAmount = rr.Items.Sum(i => i.OrderItem.UnitPrice * i.Quantity);
                    var existingRefunds = await _refundRepository.GetTotalNonRejectedRefundsForPaymentAsync(lockedPayment.PaymentId, ct);

                    if (existingRefunds + refundAmount > lockedPayment.Amount)
                    {
                        throw new BusinessException(
                            ErrorCodes.RefundExceedsPaid,
                            $"Tổng hoàn tiền ({existingRefunds + refundAmount:N0}) vượt quá số đã thanh toán ({lockedPayment.Amount:N0}).",
                            409);
                    }

                    await _refundRepository.AddAsync(new Refund
                    {
                        PaymentId = lockedPayment.PaymentId,
                        SellerOrderId = rr.SellerOrderId,
                        ReturnRequestId = rr.ReturnRequestId,
                        Amount = refundAmount,
                        Reason = $"Hoàn tiền cho yêu cầu trả hàng {rr.RequestCode}",
                        RefundStatus = RefundStatuses.Pending,
                        CreatedAt = now
                    }, ct);
                }
            }

            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return await _returnRepository.GetDtoByIdAsync(rr.ReturnRequestId, cancellationToken)
            ?? throw new NotFoundException("ReturnRequest", rr.ReturnRequestId);
    }

    private async Task EnsureSellerOrAdminAccessAsync(ReturnRequest rr, long returnRequestId, CancellationToken cancellationToken)
    {
        if (_currentUser.IsInRole(RoleNames.Admin)) return;

        var sellerId = await _currentUser.GetSellerIdAsync(cancellationToken);
        if (!sellerId.HasValue || rr.SellerOrder.SellerId != sellerId.Value)
        {
            throw new NotFoundException("ReturnRequest", returnRequestId);
        }
    }

    private long RequireCurrentUserId()
    {
        return _currentUser.UserId ?? throw BusinessException.Unauthorized();
    }
}
