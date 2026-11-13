using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Catalog;

public static class CatalogValidationExtensions
{
    public const int MaxPageSize = 100;

    public static IRuleBuilderOptions<T, string?> MustBeSafeImageUrl<T>(
        this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .Must(IsSafeImageUrl)
            .WithMessage("URL ảnh phải là đường dẫn '/uploads/...' hoặc URL http/https hợp lệ.");
    }

    public static bool IsSafeImageUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        var trimmed = value.Trim();
        if (trimmed.Contains("..", StringComparison.Ordinal) ||
            trimmed.Any(char.IsWhiteSpace))
        {
            return false;
        }

        if (trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed.Length > "/uploads/".Length;
        }

        return Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    public static void ApplyPaginationRules<T>(this AbstractValidator<T> validator)
        where T : PaginationQuery
    {
        validator.RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Số trang phải lớn hơn hoặc bằng 1.");

        validator.RuleFor(x => x.PageSize)
            .InclusiveBetween(1, MaxPageSize)
            .WithMessage($"Kích thước trang phải từ 1 đến {MaxPageSize}.");
    }

    public static IRuleBuilderOptions<T, TCollection?> MustHaveAtMostOnePrimaryImage<T, TCollection>(
        this IRuleBuilder<T, TCollection?> ruleBuilder)
        where TCollection : class, IEnumerable<ProductImageInputDto>
    {
        return ruleBuilder
            .Must(images => images == null || images.Count(i => i.IsPrimary) <= 1)
            .WithMessage("Mỗi sản phẩm chỉ được có tối đa 1 ảnh chính (isPrimary = true).");
    }

    public static void ApplyProductCoreRules<T>(
        this AbstractValidator<T> validator,
        IValidator<ProductImageInputDto> imageValidator)
        where T : IProductUpsertRequest
    {
        validator.RuleFor(x => x.ShopId)
            .GreaterThan(0).WithMessage("Vui lòng chọn shop hợp lệ.");

        validator.RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Vui lòng chọn danh mục hợp lệ.");

        validator.RuleFor(x => x.ProductName)
            .NotEmpty().WithMessage("Tên sản phẩm không được để trống.")
            .MaximumLength(255).WithMessage("Tên sản phẩm không được vượt quá 255 ký tự.");

        validator.RuleFor(x => x.Description)
            .MaximumLength(5000).WithMessage("Mô tả sản phẩm không được vượt quá 5000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        validator.RuleFor(x => x.Images)
            .MustHaveAtMostOnePrimaryImage()
            .Must(images => images == null || images.Count <= 20)
            .WithMessage("Mỗi sản phẩm chỉ hỗ trợ tối đa 20 ảnh.");

        validator.RuleForEach(x => x.Images!)
            .SetValidator(imageValidator)
            .When(x => x.Images != null);
    }

    public static string? NormalizeOptionalText(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

