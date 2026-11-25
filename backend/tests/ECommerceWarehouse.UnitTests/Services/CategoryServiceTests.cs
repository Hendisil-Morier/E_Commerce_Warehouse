using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Exceptions;

namespace ECommerceWarehouse.UnitTests.Services;

public class CategoryServiceTests
{
    private sealed class StubUnitOfWork : IUnitOfWork
    {
        public IGenericRepository<T> Repository<T>() where T : class => throw new NotImplementedException();
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
            => operation(cancellationToken);
        public void Dispose() { }
    }

    private sealed class InMemoryCategoryRepository : ICategoryRepository
    {
        public List<Category> Categories { get; } = [];
        public HashSet<long> CategoriesWithActiveProducts { get; } = [];

        public Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Category>>(Categories.Where(c => c.IsActive).ToList());

        public Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(Categories.FirstOrDefault(c => c.CategoryId == categoryId && c.IsActive));

        public Task<IReadOnlyList<Category>> GetAllAsNoTrackingAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Category>>(Categories.ToList());

        public Task<Category?> GetByIdAsync(long categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(Categories.FirstOrDefault(c => c.CategoryId == categoryId));

        public Task<bool> HasActiveProductsAsync(long categoryId, CancellationToken cancellationToken = default)
            => Task.FromResult(CategoriesWithActiveProducts.Contains(categoryId));

        public Task AddAsync(Category category, CancellationToken cancellationToken = default)
        {
            if (category.CategoryId == 0)
            {
                category.CategoryId = Categories.Count + 1;
            }
            Categories.Add(category);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task CreateCategoryAsync_CreatesActiveCategory_WhenValid()
    {
        var repo = new InMemoryCategoryRepository();
        var service = new CategoryService(repo, new StubUnitOfWork());

        var result = await service.CreateCategoryAsync(new CreateCategoryRequestDto
        {
            CategoryName = "Electronics",
            Description = "Devices and gadgets"
        });

        Assert.Equal("Electronics", result.CategoryName);
        Assert.True(result.IsActive);
        Assert.Single(repo.Categories);
    }

    [Fact]
    public async Task UpdateCategoryAsync_ThrowsBusinessException_WhenParentIsSelf()
    {
        var repo = new InMemoryCategoryRepository();
        repo.Categories.Add(new Category { CategoryId = 10, CategoryName = "Fashion", IsActive = true });
        var service = new CategoryService(repo, new StubUnitOfWork());

        await Assert.ThrowsAsync<BusinessException>(() =>
            service.UpdateCategoryAsync(10, new UpdateCategoryRequestDto
            {
                CategoryName = "Fashion",
                ParentCategoryId = 10
            }));
    }

    [Fact]
    public async Task UpdateCategoryStatusAsync_ThrowsBusinessException_WhenHidingCategoryWithActiveProducts()
    {
        var repo = new InMemoryCategoryRepository();
        repo.Categories.Add(new Category { CategoryId = 5, CategoryName = "Phones", IsActive = true });
        repo.CategoriesWithActiveProducts.Add(5);
        var service = new CategoryService(repo, new StubUnitOfWork());

        await Assert.ThrowsAsync<BusinessException>(() =>
            service.UpdateCategoryStatusAsync(5, new UpdateCategoryStatusRequestDto { IsActive = false }));
    }

    [Fact]
    public async Task UpdateCategoryStatusAsync_UpdatesStatus_WhenNoActiveProducts()
    {
        var repo = new InMemoryCategoryRepository();
        repo.Categories.Add(new Category { CategoryId = 5, CategoryName = "Phones", IsActive = true });
        var service = new CategoryService(repo, new StubUnitOfWork());

        var result = await service.UpdateCategoryStatusAsync(5, new UpdateCategoryStatusRequestDto { IsActive = false });

        Assert.False(result.IsActive);
        Assert.False(repo.Categories[0].IsActive);
    }
}
