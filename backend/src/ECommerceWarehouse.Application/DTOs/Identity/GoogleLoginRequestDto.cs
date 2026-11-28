using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Identity;

public class GoogleLoginRequestDto
{
    public string IdToken { get; set; } = null!;
}

public class GoogleLoginRequestValidator : AbstractValidator<GoogleLoginRequestDto>
{
    public GoogleLoginRequestValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("Thiếu mã xác thực Google (idToken).");
    }
}
