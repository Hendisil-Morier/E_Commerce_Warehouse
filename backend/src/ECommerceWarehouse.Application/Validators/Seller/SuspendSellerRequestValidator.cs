using ECommerceWarehouse.Application.DTOs.Seller;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Seller;

public class SuspendSellerRequestValidator : AbstractValidator<SuspendSellerRequestDto>
{
    public SuspendSellerRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Lý do đình chỉ không được vượt quá 500 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}

