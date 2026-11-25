using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Order;

public class CheckoutRequestValidator : AbstractValidator<CheckoutRequestDto>
{
    public CheckoutRequestValidator()
    {
        RuleFor(x => x.AddressId)
            .GreaterThan(0)
            .WithMessage("Vui lòng chọn địa chỉ giao hàng hợp lệ.");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty()
            .Must(m => PaymentMethods.All.Contains(m))
            .WithMessage("Phương thức thanh toán không hợp lệ (COD, BankTransfer, EWallet, CreditCard).");

        RuleFor(x => x.Note)
            .MaximumLength(500)
            .WithMessage("Ghi chú đơn hàng không vượt quá 500 ký tự.");
    }
}

public class CancelOrderRequestValidator : AbstractValidator<CancelOrderRequestDto>
{
    public CancelOrderRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Vui lòng nhập lý do hủy đơn.")
            .MaximumLength(500).WithMessage("Lý do hủy đơn không vượt quá 500 ký tự.");
    }
}

public class OrderQueryValidator : AbstractValidator<OrderQueryDto>
{
    public OrderQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || OrderStatuses.All.Contains(s))
            .WithMessage("Trạng thái đơn hàng không hợp lệ.");
    }
}

public class SellerOrderQueryValidator : AbstractValidator<SellerOrderQueryDto>
{
    public SellerOrderQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || SellerOrderStatuses.All.Contains(s))
            .WithMessage("Trạng thái đơn con không hợp lệ.");
    }
}

public class CancelSellerOrderRequestValidator : AbstractValidator<CancelSellerOrderRequestDto>
{
    public CancelSellerOrderRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Seller hủy đơn bắt buộc phải nhập lý do.")
            .MaximumLength(500).WithMessage("Lý do hủy đơn không vượt quá 500 ký tự.");
    }
}

public class CreatePaymentRequestValidator : AbstractValidator<CreatePaymentRequestDto>
{
    public CreatePaymentRequestValidator()
    {
        RuleFor(x => x.PaymentMethod)
            .NotEmpty()
            .Must(m => PaymentMethods.All.Contains(m))
            .WithMessage("Phương thức thanh toán không hợp lệ.");
    }
}
