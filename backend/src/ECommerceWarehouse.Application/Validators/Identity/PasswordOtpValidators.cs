using ECommerceWarehouse.Application.DTOs.Identity;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Identity;

public class SendRegisterOtpRequestValidator : AbstractValidator<SendRegisterOtpRequestDto>
{
    public SendRegisterOtpRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Vui lòng nhập địa chỉ email.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.");
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequestDto>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Vui lòng nhập địa chỉ email.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.");
    }
}

public class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequestDto>
{
    public VerifyOtpRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Vui lòng nhập địa chỉ email.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Vui lòng nhập mã OTP.")
            .Matches(@"^\d{6}$").WithMessage("Mã OTP phải gồm đúng 6 chữ số.");
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequestDto>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Vui lòng nhập địa chỉ email.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Vui lòng nhập mã OTP.")
            .Matches(@"^\d{6}$").WithMessage("Mã OTP phải gồm đúng 6 chữ số.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới.")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự.")
            .MaximumLength(100).WithMessage("Mật khẩu mới không được vượt quá 100 ký tự.");
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
            .MaximumLength(100).WithMessage("Mật khẩu mới không được vượt quá 100 ký tự.")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
    }
}
