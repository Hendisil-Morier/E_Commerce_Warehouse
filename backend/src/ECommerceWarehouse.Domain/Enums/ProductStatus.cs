namespace ECommerceWarehouse.Domain.Enums;

/// <summary>
/// Trạng thái vòng đời sản phẩm (khớp CK_Products_Status trong database).
/// Luồng chuẩn: Draft -> PendingReview -> Active / Rejected; Rejected -> PendingReview; Active &lt;-&gt; Inactive.
/// </summary>
public enum ProductStatus
{
    Draft,
    PendingReview,
    Active,
    Inactive,
    Rejected
}

