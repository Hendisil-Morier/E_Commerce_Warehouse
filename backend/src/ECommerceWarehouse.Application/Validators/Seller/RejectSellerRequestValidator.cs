using ECommerceWarehouse.Application.DTOs.Seller;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Seller;

public class RejectSellerRequestValidator : AbstractValidator<RejectSellerRequestDto>
{
    public RejectSellerRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Vui lòng nhập lý do từ chối hồ sơ người bán.")
            .MaximumLength(500).WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");
    }
}

