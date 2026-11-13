namespace ECommerceWarehouse.Application.DTOs.Catalog;

public class CategoryTreeDto
{
    public long CategoryId { get; init; }
    public long? ParentCategoryId { get; init; }
    public string CategoryName { get; init; } = null!;
    public string? Description { get; init; }
    public bool IsActive { get; init; }
    public IReadOnlyList<CategoryTreeDto> Children { get; init; } = Array.Empty<CategoryTreeDto>();
}

