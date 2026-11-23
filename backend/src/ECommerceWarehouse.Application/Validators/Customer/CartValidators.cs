using ECommerceWarehouse.Application.DTOs.Customer;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Customer;

public class AddCartItemRequestValidator : AbstractValidator<AddCartItemRequestDto>
{
    public AddCartItemRequestValidator()
    {
        RuleFor(x => x.VariantId)
            .GreaterThan(0)
            .WithMessage("Mã biến thể sản phẩm phải lớn hơn 0.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Số lượng sản phẩm phải lớn hơn 0.");
    }
}

public class UpdateCartItemRequestValidator : AbstractValidator<UpdateCartItemRequestDto>
{
    public UpdateCartItemRequestValidator()
    {
        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Số lượng sản phẩm phải lớn hơn 0.");
    }
}
