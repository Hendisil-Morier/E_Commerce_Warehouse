using ECommerceWarehouse.Application.DTOs.Catalog;

namespace ECommerceWarehouse.Application.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken cancellationToken = default);
}

