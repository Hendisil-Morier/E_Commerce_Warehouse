using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Catalog;

public class AdminCategoryDto
{
    public long CategoryId { get; set; }
    public long? ParentCategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCategoryRequestDto
{
    public long? ParentCategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? Description { get; set; }
}

public class UpdateCategoryRequestDto
{
    public long? ParentCategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? Description { get; set; }
}

public class UpdateCategoryStatusRequestDto
{
    public bool IsActive { get; set; }
}

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequestDto>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.CategoryName)
            .NotEmpty().WithMessage("Tên danh mục không được để trống.")
            .MaximumLength(150);

        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequestDto>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.CategoryName)
            .NotEmpty().WithMessage("Tên danh mục không được để trống.")
            .MaximumLength(150);

        RuleFor(x => x.Description).MaximumLength(500);
    }
}
