using System.Globalization;
using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Mappings;
using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class CategoryService : ICategoryService
{
    private static readonly StringComparer VietnameseNameComparer =
        StringComparer.Create(CultureInfo.GetCultureInfo("vi-VN"), ignoreCase: true);

    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CategoryService(ICategoryRepository categoryRepository, IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
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

    public async Task<IReadOnlyList<AdminCategoryDto>> GetAdminCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var all = await _categoryRepository.GetAllAsNoTrackingAsync(cancellationToken);
        return all.Select(MapToAdminDto).ToList();
    }

    public async Task<AdminCategoryDto> CreateCategoryAsync(
        CreateCategoryRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var validator = new CreateCategoryRequestValidator();
        await validator.ValidateAndThrowAsync(request, cancellationToken);

        if (request.ParentCategoryId.HasValue)
        {
            var parent = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value, cancellationToken)
                ?? throw new NotFoundException("Category", request.ParentCategoryId.Value);
        }

        var category = new Category
        {
            ParentCategoryId = request.ParentCategoryId,
            CategoryName = request.CategoryName.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToAdminDto(category);
    }

    public async Task<AdminCategoryDto> UpdateCategoryAsync(
        long categoryId,
        UpdateCategoryRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var validator = new UpdateCategoryRequestValidator();
        await validator.ValidateAndThrowAsync(request, cancellationToken);

        var category = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken)
            ?? throw new NotFoundException("Category", categoryId);

        if (request.ParentCategoryId.HasValue)
        {
            if (request.ParentCategoryId.Value == categoryId)
            {
                throw new BusinessException(
                    ErrorCodes.BusinessRuleViolation,
                    "Danh mục không thể chọn chính mình làm danh mục cha.",
                    409);
            }

            _ = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value, cancellationToken)
                ?? throw new NotFoundException("Category", request.ParentCategoryId.Value);
        }

        category.ParentCategoryId = request.ParentCategoryId;
        category.CategoryName = request.CategoryName.Trim();
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapToAdminDto(category);
    }

    public async Task<AdminCategoryDto> UpdateCategoryStatusAsync(
        long categoryId,
        UpdateCategoryStatusRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken)
            ?? throw new NotFoundException("Category", categoryId);

        if (!request.IsActive && await _categoryRepository.HasActiveProductsAsync(categoryId, cancellationToken))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Không thể ẩn danh mục đang có sản phẩm.",
                409);
        }

        category.IsActive = request.IsActive;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToAdminDto(category);
    }

    private static AdminCategoryDto MapToAdminDto(Category c) => new()
    {
        CategoryId = c.CategoryId,
        ParentCategoryId = c.ParentCategoryId,
        CategoryName = c.CategoryName,
        Description = c.Description,
        IsActive = c.IsActive
    };
}

