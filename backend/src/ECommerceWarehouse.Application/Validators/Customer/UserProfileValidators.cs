using System.Text.RegularExpressions;
using ECommerceWarehouse.Application.DTOs.Customer;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Customer;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequestDto>
{
    private static readonly Regex PhoneRegex = new(@"^(03[2-9]|05[2689]|07[06-9]|08[1-689]|09[0-46-9])\d{7}$", RegexOptions.Compiled);

    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(150).WithMessage("Họ và tên tối đa 150 ký tự.");

        When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber), () =>
        {
            RuleFor(x => x.PhoneNumber!)
                .Must(p => PhoneRegex.IsMatch(p.Trim().Replace(" ", "").Replace("-", "").Replace(".", "")))
                .WithMessage("Số điện thoại không hợp lệ (phải gồm 10 chữ số đúng định dạng nhà mạng Việt Nam).");
        });

        When(x => !string.IsNullOrWhiteSpace(x.AvatarUrl), () =>
        {
            RuleFor(x => x.AvatarUrl!)
                .MaximumLength(500).WithMessage("Đường dẫn ảnh đại diện tối đa 500 ký tự.");
        });
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequestDto>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu hiện tại.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới.")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới không được trùng với mật khẩu hiện tại.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu mới không khớp.");
    }
}
