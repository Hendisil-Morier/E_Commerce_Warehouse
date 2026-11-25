using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Review;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Review;

public class ReturnQueryValidator : AbstractValidator<ReturnQueryDto>
{
    public ReturnQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || ReturnStatuses.All.Contains(s))
            .WithMessage("Trạng thái yêu cầu trả hàng không hợp lệ.");
    }
}

public class CreateReturnRequestValidator : AbstractValidator<CreateReturnRequestDto>
{
    public CreateReturnRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Vui lòng nhập lý do trả hàng.")
            .MaximumLength(500);

        RuleFor(x => x.Items)
            .NotNull()
            .Must(items => items != null && items.Count > 0)
            .WithMessage("Vui lòng chọn ít nhất 1 sản phẩm để trả hàng.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.OrderItemId).GreaterThan(0);
            item.RuleFor(i => i.Quantity).GreaterThan(0).WithMessage("Số lượng trả phải lớn hơn 0.");
        });
    }
}

public class RejectReturnRequestValidator : AbstractValidator<RejectReturnRequestDto>
{
    public RejectReturnRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Vui lòng nhập lý do từ chối yêu cầu trả hàng.")
            .MaximumLength(500);
    }
}

public class InspectReturnItemRequestValidator : AbstractValidator<InspectReturnItemRequestDto>
{
    public InspectReturnItemRequestValidator()
    {
        RuleFor(x => x.InspectionResult)
            .NotEmpty()
            .Must(r => InspectionResults.InspectableValues.Contains(r))
            .WithMessage("Kết quả kiểm định chỉ được là Good, MinorDefect hoặc Damaged.");

        RuleFor(x => x.RestockLocationId)
            .GreaterThan(0)
            .WithMessage("Vui lòng chọn vị trí đích sau kiểm định.");

        RuleFor(x => x.InspectionNote).MaximumLength(500);
    }
}
