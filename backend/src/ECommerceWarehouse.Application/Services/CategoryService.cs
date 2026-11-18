using System.Globalization;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.Application.Services;

public class CategoryService : ICategoryService
{
    private static readonly StringComparer VietnameseNameComparer =
        StringComparer.Create(CultureInfo.GetCultureInfo("vi-VN"), ignoreCase: true);

    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<IReadOnlyList<CategoryTreeDto>> GetCategoryTreeAsync(CancellationToken cancellationToken = default)
    {
        var categories = await _categoryRepository.GetActiveAsNoTrackingAsync(cancellationToken);
        if (categories.Count == 0)
        {
            return Array.Empty<CategoryTreeDto>();
        }

        var childrenLookup = categories
            .Where(c => c.ParentCategoryId.HasValue)
            .GroupBy(c => c.ParentCategoryId!.Value)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(c => c.CategoryName, VietnameseNameComparer)
                      .ThenBy(c => c.CategoryId)
                      .ToList());

        var visited = new HashSet<long>();

        CategoryTreeDto BuildNode(Category category)
        {
            // Bảo vệ chống vòng lặp dữ liệu cha-con bất thường trong CSDL.
            if (!visited.Add(category.CategoryId))
            {
                return category.ToTreeDto(Array.Empty<CategoryTreeDto>());
            }

            var children = childrenLookup.TryGetValue(category.CategoryId, out var childEntities)
                ? childEntities.Select(BuildNode).ToList()
                : new List<CategoryTreeDto>();

            return category.ToTreeDto(children);
        }

        return categories
            .Where(c => !c.ParentCategoryId.HasValue)
            .OrderBy(c => c.CategoryName, VietnameseNameComparer)
            .ThenBy(c => c.CategoryId)
            .Select(BuildNode)
            .ToList();
    }
}

