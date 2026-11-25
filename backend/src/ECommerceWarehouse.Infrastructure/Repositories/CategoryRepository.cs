using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly ApplicationDbContext _context;

    public CategoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Category>> GetActiveAsNoTrackingAsync(CancellationToken cancellationToken = default)
        => await _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.CategoryName)
            .ThenBy(c => c.CategoryId)
            .ToListAsync(cancellationToken);

    public async Task<Category?> GetActiveByIdAsNoTrackingAsync(long categoryId, CancellationToken cancellationToken = default)
        => await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.IsActive, cancellationToken);

    public async Task<IReadOnlyList<Category>> GetAllAsNoTrackingAsync(CancellationToken cancellationToken = default)
        => await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.CategoryName)
            .ThenBy(c => c.CategoryId)
            .ToListAsync(cancellationToken);

    public async Task<Category?> GetByIdAsync(long categoryId, CancellationToken cancellationToken = default)
        => await _context.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId, cancellationToken);

    public async Task<bool> HasActiveProductsAsync(long categoryId, CancellationToken cancellationToken = default)
        => await _context.Products
            .AsNoTracking()
            .AnyAsync(p => p.CategoryId == categoryId, cancellationToken);

    public async Task AddAsync(Category category, CancellationToken cancellationToken = default)
        => await _context.Categories.AddAsync(category, cancellationToken);
}

