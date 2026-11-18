using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Application.Contracts.Persistence;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default);
    Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default);
}

