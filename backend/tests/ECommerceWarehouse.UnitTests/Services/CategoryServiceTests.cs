using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Entities.Catalog;

namespace ECommerceWarehouse.UnitTests.Services;

public class CategoryServiceTests
{
    private sealed class InMemoryCategoryRepository : ICategoryRepository
    {
        public List<Category> Categories { get; } = [];

        public Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default)
        {
            IReadOnlyList<Category> active = Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.CategoryName, StringComparer.OrdinalIgnoreCase)
                .ThenBy(c => c.CategoryId)
                .ToList();

            return Task.FromResult(active);
        }

        public Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(Categories.FirstOrDefault(c => c.CategoryId == categoryId && c.IsActive));
    }

    [Fact]
    public async Task GetCategoryTree_BuildsMultiLevelHierarchyAndExcludesInactiveSubtrees()
    {
        var repo = new InMemoryCategoryRepository();
        repo.Categories.AddRange([
            new Category { CategoryId = 1, ParentCategoryId = null, CategoryName = "Điện tử", IsActive = true },
            new Category { CategoryId = 2, ParentCategoryId = 1, CategoryName = "Điện thoại", IsActive = true },
            new Category { CategoryId = 3, ParentCategoryId = 2, CategoryName = "Ốp lưng", IsActive = true },
            new Category { CategoryId = 4, ParentCategoryId = 1, CategoryName = "Ẩn tạm", IsActive = false },
            new Category { CategoryId = 5, ParentCategoryId = null, CategoryName = "Danh mục bị tắt", IsActive = false },
            new Category { CategoryId = 6, ParentCategoryId = 5, CategoryName = "Con của danh mục tắt", IsActive = true },
            new Category { CategoryId = 7, ParentCategoryId = null, CategoryName = "Thời trang", IsActive = true }
        ]);

        var service = new CategoryService(repo);
        var tree = await service.GetCategoryTreeAsync();

        Assert.Equal(2, tree.Count);
        Assert.Equal("Điện tử", tree[0].CategoryName);
        Assert.Equal("Thời trang", tree[1].CategoryName);

        var phones = Assert.Single(tree[0].Children);
        Assert.Equal("Điện thoại", phones.CategoryName);
        var cases = Assert.Single(phones.Children);
        Assert.Equal("Ốp lưng", cases.CategoryName);
    }
}

