using ECommerceWarehouse.Application.DTOs.Seller;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Seller;

public class RegisterSellerRequestValidator : AbstractValidator<RegisterSellerRequestDto>
{
    public RegisterSellerRequestValidator()
    {
        RuleFor(x => x.BusinessName)
            .NotEmpty().WithMessage("Tên hộ kinh doanh / doanh nghiệp không được để trống.")
            .MaximumLength(200).WithMessage("Tên hộ kinh doanh / doanh nghiệp không được vượt quá 200 ký tự.");

        RuleFor(x => x.TaxCode)
            .MaximumLength(20).WithMessage("Mã số thuế không được vượt quá 20 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.TaxCode));

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Mô tả gian hàng không được vượt quá 1000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));
    }
}

