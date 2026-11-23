using ECommerceWarehouse.Application.DTOs.Admin;
using ECommerceWarehouse.Application.DTOs.Common;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Admin;

public class AdminUserQueryValidator : AbstractValidator<AdminUserQueryDto>
{
    public AdminUserQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Trang phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, PaginationQuery.MaxPageSize)
            .WithMessage($"Số lượng bản ghi mỗi trang phải từ 1 đến {PaginationQuery.MaxPageSize}.");

        RuleFor(x => x.Search)
            .MaximumLength(100)
            .WithMessage("Từ khóa tìm kiếm không vượt quá 100 ký tự.");
    }
}

public class UpdateUserStatusRequestValidator : AbstractValidator<UpdateUserStatusRequestDto>
{
    public UpdateUserStatusRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do thay đổi trạng thái không vượt quá 500 ký tự.");
    }
}

public class UpdateUserRolesRequestValidator : AbstractValidator<UpdateUserRolesRequestDto>
{
    public UpdateUserRolesRequestValidator()
    {
        RuleFor(x => x.Roles)
            .NotNull()
            .WithMessage("Danh sách vai trò không được null.")
            .Must(roles => roles != null && roles.Count > 0)
            .WithMessage("Người dùng phải có ít nhất một vai trò.");

        RuleForEach(x => x.Roles)
            .NotEmpty()
            .WithMessage("Tên vai trò không được để trống.")
            .MaximumLength(50)
            .WithMessage("Tên vai trò không vượt quá 50 ký tự.");
    }
}
