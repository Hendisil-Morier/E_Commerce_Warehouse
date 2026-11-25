using ECommerceWarehouse.Application.DTOs.Catalog;

namespace ECommerceWarehouse.Application.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminCategoryDto>> GetAdminCategoriesAsync(CancellationToken cancellationToken = default);
    Task<AdminCategoryDto> CreateCategoryAsync(CreateCategoryRequestDto request, CancellationToken cancellationToken = default);
    Task<AdminCategoryDto> UpdateCategoryAsync(long categoryId, UpdateCategoryRequestDto request, CancellationToken cancellationToken = default);
    Task<AdminCategoryDto> UpdateCategoryStatusAsync(long categoryId, UpdateCategoryStatusRequestDto request, CancellationToken cancellationToken = default);
}

