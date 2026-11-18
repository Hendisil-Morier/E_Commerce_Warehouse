using ECommerceWarehouse.Application.DTOs.Catalog;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Catalog;

public class CreateShopRequestValidator : AbstractValidator<CreateShopRequestDto>
{
    public CreateShopRequestValidator()
    {
        RuleFor(x => x.ShopName)
            .NotEmpty().WithMessage("Tên shop không được để trống.")
            .MaximumLength(200).WithMessage("Tên shop không được vượt quá 200 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Mô tả shop không được vượt quá 1000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.LogoUrl)
            .MaximumLength(1000).WithMessage("Đường dẫn logo không được vượt quá 1000 ký tự.")
            .MustBeSafeImageUrl()
            .When(x => !string.IsNullOrWhiteSpace(x.LogoUrl));
    }
}

