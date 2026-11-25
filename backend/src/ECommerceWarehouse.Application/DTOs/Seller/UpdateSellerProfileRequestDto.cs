using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Seller;

public class UpdateSellerProfileRequestDto
{
    public string BusinessName { get; set; } = null!;
    public string? TaxCode { get; set; }
    public string? Description { get; set; }
}

public class UpdateSellerProfileRequestValidator : AbstractValidator<UpdateSellerProfileRequestDto>
{
    public UpdateSellerProfileRequestValidator()
    {
        RuleFor(x => x.BusinessName)
            .NotEmpty().WithMessage("Tên doanh nghiệp không được để trống.")
            .MaximumLength(200);

        RuleFor(x => x.TaxCode).MaximumLength(50);
        RuleFor(x => x.Description).MaximumLength(1000);
    }
}
