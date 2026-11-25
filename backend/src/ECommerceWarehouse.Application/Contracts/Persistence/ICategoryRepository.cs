using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default);
    Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetAllAsNoTrackingAsync(CancellationToken cancellationToken = default);
    Task<Category?> GetByIdAsync(long categoryId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveProductsAsync(long categoryId, CancellationToken cancellationToken = default);
    Task AddAsync(Category category, CancellationToken cancellationToken = default);
}

