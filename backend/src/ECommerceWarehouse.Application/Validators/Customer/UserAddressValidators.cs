using System.Text.RegularExpressions;
using ECommerceWarehouse.Application.DTOs.Customer;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Customer;

public class CreateAddressRequestValidator : AbstractValidator<CreateAddressRequestDto>
{
    private static readonly Regex PhoneRegex = new(@"^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])\d{7}$", RegexOptions.Compiled);

    public CreateAddressRequestValidator()
    {
        RuleFor(x => x.RecipientName)
            .NotEmpty().WithMessage("Tên người nhận không được để trống.")
            .MaximumLength(150).WithMessage("Tên người nhận tối đa 150 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Must(p => PhoneRegex.IsMatch(p.Trim().Replace(" ", "").Replace("-", "").Replace(".", "")))
            .WithMessage("Số điện thoại nhận hàng không hợp lệ (phải gồm 10 chữ số nhà mạng Việt Nam).");

        RuleFor(x => x.Province)
            .NotEmpty().WithMessage("Tỉnh/Thành phố không được để trống.")
            .MaximumLength(100).WithMessage("Tỉnh/Thành phố tối đa 100 ký tự.");

        RuleFor(x => x.District)
            .NotEmpty().WithMessage("Quận/Huyện không được để trống.")
            .MaximumLength(100).WithMessage("Quận/Huyện tối đa 100 ký tự.");

        RuleFor(x => x.Ward)
            .NotEmpty().WithMessage("Phường/Xã không được để trống.")
            .MaximumLength(100).WithMessage("Phường/Xã tối đa 100 ký tự.");

        RuleFor(x => x.StreetAddress)
            .NotEmpty().WithMessage("Địa chỉ chi tiết (số nhà, tên đường) không được để trống.")
            .MaximumLength(300).WithMessage("Địa chỉ chi tiết tối đa 300 ký tự.");
    }
}

public class UpdateAddressRequestValidator : AbstractValidator<UpdateAddressRequestDto>
{
    private static readonly Regex PhoneRegex = new(@"^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])\d{7}$", RegexOptions.Compiled);

    public UpdateAddressRequestValidator()
    {
        RuleFor(x => x.RecipientName)
            .NotEmpty().WithMessage("Tên người nhận không được để trống.")
            .MaximumLength(150).WithMessage("Tên người nhận tối đa 150 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Must(p => PhoneRegex.IsMatch(p.Trim().Replace(" ", "").Replace("-", "").Replace(".", "")))
            .WithMessage("Số điện thoại nhận hàng không hợp lệ (phải gồm 10 chữ số nhà mạng Việt Nam).");

        RuleFor(x => x.Province)
            .NotEmpty().WithMessage("Tỉnh/Thành phố không được để trống.")
            .MaximumLength(100).WithMessage("Tỉnh/Thành phố tối đa 100 ký tự.");

        RuleFor(x => x.District)
            .NotEmpty().WithMessage("Quận/Huyện không được để trống.")
            .MaximumLength(100).WithMessage("Quận/Huyện tối đa 100 ký tự.");

        RuleFor(x => x.Ward)
            .NotEmpty().WithMessage("Phường/Xã không được để trống.")
            .MaximumLength(100).WithMessage("Phường/Xã tối đa 100 ký tự.");

        RuleFor(x => x.StreetAddress)
            .NotEmpty().WithMessage("Địa chỉ chi tiết không được để trống.")
            .MaximumLength(300).WithMessage("Địa chỉ chi tiết tối đa 300 ký tự.");
    }
}
