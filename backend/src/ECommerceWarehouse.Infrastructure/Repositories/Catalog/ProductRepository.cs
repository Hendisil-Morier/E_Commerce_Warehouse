using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Infrastructure.Data;
using ECommerceWarehouse.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ECommerceWarehouse.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly ApplicationDbContext _context;

    public ProductRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<Product>> GetSellerPagedAsync(
        long sellerId,
        SellerProductQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var productsQuery = _context.Products
            .AsNoTracking()
            .Include(p => p.Shop)
            .Include(p => p.Category)
            .Where(p => p.Shop.SellerId == sellerId);

        if (query.ShopId.HasValue)
        {
            var shopId = query.ShopId.Value;
            productsQuery = productsQuery.Where(p => p.ShopId == shopId);
        }

        if (query.Status.HasValue)
        {
            var status = query.Status.Value;
            productsQuery = productsQuery.Where(p => p.ProductStatus == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var keyword = query.Q.Trim();
            productsQuery = productsQuery.Where(p =>
                p.ProductName.Contains(keyword) ||
                p.Variants.Any(v => v.SKU.Contains(keyword)));
        }

        productsQuery = ApplySorting(productsQuery, query);
        var paged = await productsQuery.ToPagedResultAsync(query, cancellationToken);
        await AttachImagesAndVariantsAsync(paged.Items, asNoTracking: true, cancellationToken);

        return paged;
    }

    public async Task<Product?> GetByIdForSellerWithDetailsAsync(
        long productId,
        long sellerId,
        bool asNoTracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = BuildProductDetailQuery(asNoTracking);
        var product = await query.FirstOrDefaultAsync(
            p => p.ProductId == productId && p.Shop.SellerId == sellerId,
            cancellationToken);

        if (product != null)
        {
            await AttachImagesAndVariantsAsync([product], asNoTracking, cancellationToken);
        }

        return product;
    }

    public async Task<PagedResult<Product>> GetAdminPagedAsync(
        AdminProductQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var productsQuery = _context.Products
            .AsNoTracking()
            .Include(p => p.Shop)
                .ThenInclude(s => s.Seller)
            .Include(p => p.Category)
            .AsQueryable();

        if (query.Status.HasValue)
        {
            var status = query.Status.Value;
            productsQuery = productsQuery.Where(p => p.ProductStatus == status);
        }

        if (query.ShopId.HasValue)
        {
            var shopId = query.ShopId.Value;
            productsQuery = productsQuery.Where(p => p.ShopId == shopId);
        }

        if (query.CategoryId.HasValue)
        {
            var categoryId = query.CategoryId.Value;
            productsQuery = productsQuery.Where(p => p.CategoryId == categoryId);
        }

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var keyword = query.Q.Trim();
            productsQuery = productsQuery.Where(p =>
                p.ProductName.Contains(keyword) ||
                p.Shop.ShopName.Contains(keyword) ||
                p.Shop.Seller.BusinessName.Contains(keyword) ||
                p.Variants.Any(v => v.SKU.Contains(keyword)));
        }

        productsQuery = ApplySorting(productsQuery, query);
        var paged = await productsQuery.ToPagedResultAsync(query, cancellationToken);
        await AttachImagesAndVariantsAsync(paged.Items, asNoTracking: true, cancellationToken);

        return paged;
    }

    public async Task<Product?> GetByIdWithDetailsAsync(
        long productId,
        bool asNoTracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = BuildProductDetailQuery(asNoTracking);
        var product = await query.FirstOrDefaultAsync(p => p.ProductId == productId, cancellationToken);

        if (product != null)
        {
            await AttachImagesAndVariantsAsync([product], asNoTracking, cancellationToken);
        }

        return product;
    }

    public async Task<PagedResult<Product>> GetPublicPagedAsync(
        PublicProductQueryDto query,
        IReadOnlyCollection<long>? expandedCategoryIds = null,
        CancellationToken cancellationToken = default)
    {
        var productsQuery = BuildPublicBaseQuery();

        if (expandedCategoryIds is { Count: > 0 })
        {
            productsQuery = productsQuery.Where(p => expandedCategoryIds.Contains(p.CategoryId));
        }

        if (query.ShopId.HasValue)
        {
            var shopId = query.ShopId.Value;
            productsQuery = productsQuery.Where(p => p.ShopId == shopId);
        }

        if (query.MinPrice.HasValue || query.MaxPrice.HasValue)
        {
            var minPrice = query.MinPrice;
            var maxPrice = query.MaxPrice;
            productsQuery = productsQuery.Where(p =>
                p.Variants.Any(v =>
                    v.IsActive &&
                    (!minPrice.HasValue || v.Price >= minPrice.Value) &&
                    (!maxPrice.HasValue || v.Price <= maxPrice.Value)));
        }

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var keyword = query.Q.Trim();
            productsQuery = productsQuery.Where(p =>
                p.ProductName.Contains(keyword) ||
                p.Variants.Any(v => v.IsActive && v.SKU.Contains(keyword)));
        }

        if (query.InStockOnly == true)
        {
            productsQuery = productsQuery.Where(p =>
                p.Variants.Any(v =>
                    v.IsActive &&
                    _context.VariantAvailabilities
                        .Where(va => va.VariantId == v.VariantId)
                        .Sum(va => (decimal?)va.Available) > 0));
        }

        productsQuery = ApplyPublicSorting(productsQuery, query);
        var paged = await productsQuery.ToPagedResultAsync(query, cancellationToken);
        await AttachImagesAndVariantsAsync(paged.Items, asNoTracking: true, cancellationToken, onlyActiveVariants: true);

        return paged;
    }

    public async Task<Product?> GetPublicByIdWithDetailsAsync(
        long productId,
        CancellationToken cancellationToken = default)
    {
        var product = await BuildPublicBaseQuery()
            .FirstOrDefaultAsync(p => p.ProductId == productId, cancellationToken);

        if (product != null)
        {
            await AttachImagesAndVariantsAsync([product], asNoTracking: true, cancellationToken, onlyActiveVariants: true);
        }

        return product;
    }

    public async Task<IReadOnlyDictionary<long, int>> GetVariantAvailabilityByIdsAsync(
        IReadOnlyCollection<long> variantIds,
        CancellationToken cancellationToken = default)
    {
        if (variantIds.Count == 0)
        {
            return new Dictionary<long, int>();
        }

        var distinctIds = variantIds.Distinct().ToList();
        var rows = await _context.VariantAvailabilities
            .AsNoTracking()
            .Where(va => distinctIds.Contains(va.VariantId))
            .GroupBy(va => va.VariantId)
            .Select(g => new
            {
                VariantId = g.Key,
                Available = g.Sum(x => x.Available)
            })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(
            r => r.VariantId,
            r => (int)Math.Clamp(r.Available, 0m, int.MaxValue));
    }

    public async Task<ProductVariant?> GetVariantByIdForSellerAsync(
        long variantId,
        long sellerId,
        CancellationToken cancellationToken = default)
    {
        var variant = await _context.ProductVariants
            .Include(v => v.Product)
                .ThenInclude(p => p.Shop)
            .FirstOrDefaultAsync(
                v => v.VariantId == variantId && v.Product.Shop.SellerId == sellerId,
                cancellationToken);

        if (variant != null)
        {
            await _context.ProductVariants
                .Where(v => v.ProductId == variant.ProductId)
                .LoadAsync(cancellationToken);
        }

        return variant;
    }

    public async Task<bool> ExistsSkuAsync(
        string sku,
        long? excludeVariantId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ProductVariants
            .AsNoTracking()
            .Where(v => v.SKU == sku);

        if (excludeVariantId.HasValue)
        {
            var excludedId = excludeVariantId.Value;
            query = query.Where(v => v.VariantId != excludedId);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<bool> ExistsBarcodeAsync(
        string barcode,
        long? excludeVariantId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ProductVariants
            .AsNoTracking()
            .Where(v => v.Barcode != null && v.Barcode == barcode);

        if (excludeVariantId.HasValue)
        {
            var excludedId = excludeVariantId.Value;
            query = query.Where(v => v.VariantId != excludedId);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(Product product, CancellationToken cancellationToken = default)
        => await _context.Products.AddAsync(product, cancellationToken);

    public async Task AddVariantAsync(ProductVariant variant, CancellationToken cancellationToken = default)
        => await _context.ProductVariants.AddAsync(variant, cancellationToken);

    public void Update(Product product)
    {
        if (_context.Entry(product).State == EntityState.Detached)
        {
            _context.Products.Update(product);
        }
    }

    public void UpdateVariant(ProductVariant variant)
    {
        if (_context.Entry(variant).State == EntityState.Detached)
        {
            _context.ProductVariants.Update(variant);
        }
    }

    public void RemoveImages(IEnumerable<ProductImage> images)
        => _context.ProductImages.RemoveRange(images);

    private IQueryable<Product> BuildProductDetailQuery(bool asNoTracking)
    {
        var query = _context.Products
            .Include(p => p.Shop)
                .ThenInclude(s => s.Seller)
            .Include(p => p.Category)
            .AsQueryable();

        return asNoTracking ? query.AsNoTracking() : query;
    }

    private IQueryable<Product> BuildPublicBaseQuery()
        => _context.Products
            .AsNoTracking()
            .Include(p => p.Shop)
                .ThenInclude(s => s.Seller)
            .Include(p => p.Category)
            .Where(p =>
                p.ProductStatus == ProductStatus.Active &&
                p.Shop.IsActive &&
                p.Shop.Seller.Status == SellerStatus.Approved &&
                p.Category.IsActive &&
                p.Variants.Any(v => v.IsActive));

    private async Task AttachImagesAndVariantsAsync(
        IReadOnlyList<Product> products,
        bool asNoTracking,
        CancellationToken cancellationToken,
        bool onlyActiveVariants = false)
    {
        if (products.Count == 0)
        {
            return;
        }

        var productIds = products.Select(p => p.ProductId).Distinct().ToList();

        var imagesQuery = _context.ProductImages.Where(i => productIds.Contains(i.ProductId));
        var variantsQuery = _context.ProductVariants.Where(v => productIds.Contains(v.ProductId));

        if (onlyActiveVariants)
        {
            variantsQuery = variantsQuery.Where(v => v.IsActive);
        }

        if (asNoTracking)
        {
            imagesQuery = imagesQuery.AsNoTracking();
            variantsQuery = variantsQuery.AsNoTracking();
        }

        var images = await imagesQuery.ToListAsync(cancellationToken);
        var variants = await variantsQuery.ToListAsync(cancellationToken);

        var imagesByProduct = images.ToLookup(i => i.ProductId);
        var variantsByProduct = variants.ToLookup(v => v.ProductId);

        foreach (var product in products)
        {
            foreach (var image in imagesByProduct[product.ProductId])
            {
                if (!product.Images.Contains(image))
                {
                    product.Images.Add(image);
                }
            }

            foreach (var variant in variantsByProduct[product.ProductId])
            {
                if (!product.Variants.Contains(variant))
                {
                    product.Variants.Add(variant);
                }
            }
        }
    }

    private static IQueryable<Product> ApplyPublicSorting(IQueryable<Product> query, PaginationQuery pagination)
    {
        var (field, isDescending) = pagination.ParseSort();
        var normalizedField = field.ToLowerInvariant();

        if (normalizedField is "price_asc")
        {
            normalizedField = "price";
            isDescending = false;
        }
        else if (normalizedField is "price_desc")
        {
            normalizedField = "price";
            isDescending = true;
        }
        else if (normalizedField is "newest")
        {
            normalizedField = "createdat";
            isDescending = true;
        }

        return (normalizedField, isDescending) switch
        {
            ("price", false) or ("minprice", false) => query
                .OrderBy(p => p.Variants.Where(v => v.IsActive).Min(v => v.Price))
                .ThenByDescending(p => p.ProductId),
            ("price", true) or ("minprice", true) => query
                .OrderByDescending(p => p.Variants.Where(v => v.IsActive).Min(v => v.Price))
                .ThenByDescending(p => p.ProductId),
            _ => ApplySorting(query, normalizedField, isDescending)
        };
    }

    private static IQueryable<Product> ApplySorting(IQueryable<Product> query, PaginationQuery pagination)
    {
        var (field, isDescending) = pagination.ParseSort();
        return ApplySorting(query, field.ToLowerInvariant(), isDescending);
    }

    private static IQueryable<Product> ApplySorting(IQueryable<Product> query, string normalizedField, bool isDescending)
    {
        return (normalizedField, isDescending) switch
        {
            ("productname", true) => query.OrderByDescending(p => p.ProductName).ThenByDescending(p => p.ProductId),
            ("productname", false) => query.OrderBy(p => p.ProductName).ThenBy(p => p.ProductId),
            ("status", true) or ("productstatus", true) => query.OrderByDescending(p => p.ProductStatus).ThenByDescending(p => p.ProductId),
            ("status", false) or ("productstatus", false) => query.OrderBy(p => p.ProductStatus).ThenBy(p => p.ProductId),
            ("updatedat", true) => query.OrderByDescending(p => p.UpdatedAt).ThenByDescending(p => p.ProductId),
            ("updatedat", false) => query.OrderBy(p => p.UpdatedAt).ThenBy(p => p.ProductId),
            ("productid", true) => query.OrderByDescending(p => p.ProductId),
            ("productid", false) => query.OrderBy(p => p.ProductId),
            (_, true) => query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.ProductId),
            (_, false) => query.OrderBy(p => p.CreatedAt).ThenBy(p => p.ProductId)
        };
    }
}

