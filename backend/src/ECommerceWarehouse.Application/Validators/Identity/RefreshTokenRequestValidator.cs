using ECommerceWarehouse.Application.DTOs.Identity;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Identity;

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequestDto>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token không được để trống.");
    }
}

