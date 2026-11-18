using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Seller;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Seller;

public class SellerListQueryValidator : AbstractValidator<SellerListQueryDto>
{
    public SellerListQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Trang phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, PaginationQuery.MaxPageSize)
            .WithMessage($"Số dòng mỗi trang phải từ 1 đến {PaginationQuery.MaxPageSize}.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái lọc không hợp lệ.")
            .When(x => x.Status.HasValue);

        RuleFor(x => x.Search)
            .MaximumLength(200).WithMessage("Từ khóa tìm kiếm không được vượt quá 200 ký tự.")
            .When(x => x.Search != null);
    }
}

