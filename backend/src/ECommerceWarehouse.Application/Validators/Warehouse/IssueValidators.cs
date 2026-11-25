using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Warehouse;

public class IssueQueryValidator : AbstractValidator<IssueQueryDto>
{
    public IssueQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || IssueStatuses.All.Contains(s))
            .WithMessage("Trạng thái phiếu xuất không hợp lệ.");
    }
}

public class ScanIssueLineRequestValidator : AbstractValidator<ScanIssueLineRequestDto>
{
    public ScanIssueLineRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Vui lòng nhập hoặc quét mã SKU/Barcode.")
            .MaximumLength(100);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng quét phải lớn hơn 0.");
    }
}
