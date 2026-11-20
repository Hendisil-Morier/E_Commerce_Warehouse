using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdWithDetailsAsNoTrackingAsync(
        long userId,
        CancellationToken cancellationToken = default);

    Task<Cart?> GetByUserIdWithItemsAsync(
        long userId,
        CancellationToken cancellationToken = default);

    Task<CartItem?> GetItemByIdForUserWithCatalogAsync(
        long cartItemId,
        long userId,
        CancellationToken cancellationToken = default);

    Task<CartItem?> GetItemByIdForUserAsync(
        long cartItemId,
        long userId,
        CancellationToken cancellationToken = default);

    Task<ProductVariant?> GetVariantWithCatalogAsNoTrackingAsync(
        long variantId,
        CancellationToken cancellationToken = default);

    Task AddCartAsync(Cart cart, CancellationToken cancellationToken = default);

    Task AddCartItemAsync(CartItem item, CancellationToken cancellationToken = default);

    void RemoveCartItem(CartItem item);

    /// <summary>
    /// Lưu thay đổi giỏ hàng; chỉ chuyển lỗi trùng khóa duy nhất MySQL 1062 của UQ_Carts_User hoặc UQ_CartItems_Cart_Variant
    /// sang BusinessException.ConcurrencyConflict (409).
    /// </summary>
    Task SaveChangesHandlingConcurrencyAsync(CancellationToken cancellationToken = default);
}
