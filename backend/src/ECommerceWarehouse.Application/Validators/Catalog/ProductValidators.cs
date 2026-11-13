using ECommerceWarehouse.Application.DTOs.Catalog;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Catalog;

public class ProductImageInputValidator : AbstractValidator<ProductImageInputDto>
{
    public ProductImageInputValidator()
    {
        RuleFor(x => x.ImageUrl)
            .NotEmpty().WithMessage("Đường dẫn ảnh không được để trống.")
            .MaximumLength(1000).WithMessage("Đường dẫn ảnh không được vượt quá 1000 ký tự.")
            .MustBeSafeImageUrl();

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị ảnh phải lớn hơn hoặc bằng 0.");
    }
}

public class UpsertVariantRequestValidator : AbstractValidator<UpsertVariantRequestDto>
{
    public UpsertVariantRequestValidator()
    {
        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("SKU không được để trống.")
            .MaximumLength(64).WithMessage("SKU không được vượt quá 64 ký tự.")
            .Must(sku => string.IsNullOrWhiteSpace(sku) || !sku.Trim().Any(char.IsWhiteSpace))
            .WithMessage("SKU không được chứa khoảng trắng.");

        RuleFor(x => x.Barcode)
            .MaximumLength(64).WithMessage("Barcode không được vượt quá 64 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Barcode));

        RuleFor(x => x.VariantName)
            .NotEmpty().WithMessage("Tên biến thể không được để trống.")
            .MaximumLength(200).WithMessage("Tên biến thể không được vượt quá 200 ký tự.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Giá bán biến thể phải lớn hơn 0.");

        RuleFor(x => x.WeightGrams)
            .GreaterThan(0).WithMessage("Trọng lượng (gram) phải lớn hơn 0.")
            .When(x => x.WeightGrams.HasValue);
    }
}

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequestDto>
{
    private static readonly ProductImageInputValidator ImageValidator = new();
    private static readonly UpsertVariantRequestValidator VariantValidator = new();

    public CreateProductRequestValidator()
    {
        this.ApplyProductCoreRules(ImageValidator);

        RuleFor(x => x.Variants)
            .Must(variants => variants == null || variants.Count <= 50)
            .WithMessage("Mỗi sản phẩm chỉ hỗ trợ tối đa 50 biến thể.")
            .Must(HaveUniqueSkus)
            .WithMessage("Danh sách biến thể không được chứa SKU trùng lặp.")
            .Must(HaveUniqueBarcodes)
            .WithMessage("Danh sách biến thể không được chứa Barcode trùng lặp.");

        RuleForEach(x => x.Variants)
            .SetValidator(VariantValidator)
            .When(x => x.Variants != null);
    }

    private static bool HaveUniqueSkus(List<UpsertVariantRequestDto>? variants)
    {
        if (variants == null || variants.Count <= 1)
        {
            return true;
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var variant in variants)
        {
            var sku = variant.SKU.Trim();
            if (!string.IsNullOrEmpty(sku) && !seen.Add(sku))
            {
                return false;
            }
        }

        return true;
    }

    private static bool HaveUniqueBarcodes(List<UpsertVariantRequestDto>? variants)
    {
        if (variants == null || variants.Count <= 1)
        {
            return true;
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var variant in variants)
        {
            var barcode = CatalogValidationExtensions.NormalizeOptionalText(variant.Barcode);
            if (!string.IsNullOrEmpty(barcode) && !seen.Add(barcode))
            {
                return false;
            }
        }

        return true;
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequestDto>
{
    private static readonly ProductImageInputValidator ImageValidator = new();

    public UpdateProductRequestValidator()
    {
        this.ApplyProductCoreRules(ImageValidator);
    }
}

public class SellerProductQueryValidator : AbstractValidator<SellerProductQueryDto>
{
    public SellerProductQueryValidator()
    {
        this.ApplyPaginationRules();

        RuleFor(x => x.ShopId)
            .GreaterThan(0).WithMessage("Mã shop phải lớn hơn 0.")
            .When(x => x.ShopId.HasValue);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái sản phẩm không hợp lệ.")
            .When(x => x.Status.HasValue);

        RuleFor(x => x.Q)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Q));
    }
}

public class AdminProductQueryValidator : AbstractValidator<AdminProductQueryDto>
{
    public AdminProductQueryValidator()
    {
        this.ApplyPaginationRules();

        RuleFor(x => x.ShopId)
            .GreaterThan(0).WithMessage("Mã shop phải lớn hơn 0.")
            .When(x => x.ShopId.HasValue);

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Mã danh mục phải lớn hơn 0.")
            .When(x => x.CategoryId.HasValue);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái sản phẩm không hợp lệ.")
            .When(x => x.Status.HasValue);

        RuleFor(x => x.Q)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Q));
    }
}

public class RejectProductRequestValidator : AbstractValidator<RejectProductRequestDto>
{
    public RejectProductRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Vui lòng nhập lý do từ chối sản phẩm.")
            .MaximumLength(500).WithMessage("Lý do từ chối không được vượt quá 500 ký tự.");
    }
}

public class PublicProductQueryValidator : AbstractValidator<PublicProductQueryDto>
{
    public PublicProductQueryValidator()
    {
        this.ApplyPaginationRules();

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Mã danh mục phải lớn hơn 0.")
            .When(x => x.CategoryId.HasValue);

        RuleFor(x => x.ShopId)
            .GreaterThan(0).WithMessage("Mã shop phải lớn hơn 0.")
            .When(x => x.ShopId.HasValue);

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá tối thiểu phải lớn hơn hoặc bằng 0.")
            .When(x => x.MinPrice.HasValue);

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá tối đa phải lớn hơn hoặc bằng 0.")
            .When(x => x.MaxPrice.HasValue);

        RuleFor(x => x)
            .Must(x => !x.MinPrice.HasValue || !x.MaxPrice.HasValue || x.MaxPrice.Value >= x.MinPrice.Value)
            .WithMessage("Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.");

        RuleFor(x => x.Q)
            .MaximumLength(100).WithMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Q));
    }
}

