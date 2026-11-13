using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.Application.Services;

internal static class CatalogProductRules
{
    public static void EnsureReadyForReviewOrPublish(
        Product product,
        bool shopIsActive,
        SellerStatus? sellerStatus = null,
        string actionVerb = "gửi duyệt")
    {
        if (!shopIsActive)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Shop của sản phẩm đang tạm ngưng hoạt động, không thể {actionVerb}.");
        }

        if (sellerStatus.HasValue && sellerStatus.Value != SellerStatus.Approved)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Hồ sơ người bán không ở trạng thái Approved, không thể {actionVerb}.");
        }

        if (product.Images.Count == 0)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Sản phẩm phải có ít nhất 1 ảnh trước khi {actionVerb}.");
        }

        if (!product.Variants.Any(v => v.IsActive))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                $"Sản phẩm phải có ít nhất 1 biến thể đang hoạt động (isActive = true) trước khi {actionVerb}.");
        }
    }
}

