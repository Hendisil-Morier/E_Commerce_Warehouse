using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Order;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Order;

public class RefundQueryValidator : AbstractValidator<RefundQueryDto>
{
    public RefundQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || RefundStatuses.All.Contains(s))
            .WithMessage("Trạng thái hoàn tiền không hợp lệ.");
    }
}

public class RejectRefundRequestValidator : AbstractValidator<RejectRefundRequestDto>
{
    public RejectRefundRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Vui lòng nhập lý do từ chối hoàn tiền.")
            .MaximumLength(500);
    }
}
