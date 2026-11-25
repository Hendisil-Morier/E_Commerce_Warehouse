using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Shipping;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Shipping;

public class ShipmentQueryValidator : AbstractValidator<ShipmentQueryDto>
{
    public ShipmentQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || ShippingStatuses.All.Contains(s))
            .WithMessage("Trạng thái vận đơn không hợp lệ.");
    }
}

public class CreateShipmentRequestValidator : AbstractValidator<CreateShipmentRequestDto>
{
    public CreateShipmentRequestValidator()
    {
        RuleFor(x => x.CarrierId)
            .GreaterThan(0).WithMessage("Vui lòng chọn hãng vận chuyển hợp lệ.");

        RuleFor(x => x.TrackingNumber)
            .NotEmpty().WithMessage("Mã vận đơn không được để trống.")
            .MaximumLength(100);

        RuleFor(x => x.CodAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.CodAmount.HasValue)
            .WithMessage("Số tiền thu hộ (COD) không được âm.");
    }
}

public class UpdateShipmentStatusRequestValidator : AbstractValidator<UpdateShipmentStatusRequestDto>
{
    public UpdateShipmentStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => ShippingStatuses.All.Contains(s))
            .WithMessage("Trạng thái vận đơn không hợp lệ.");

        RuleFor(x => x.FailedReason)
            .NotEmpty()
            .When(x => x.Status == ShippingStatuses.Failed)
            .WithMessage("Vui lòng nhập lý do khi cập nhật giao hàng thất bại.");

        RuleFor(x => x.FailedReason)
            .MaximumLength(500);
    }
}
