namespace ECommerceWarehouse.Domain.Entities.Catalog;

public class Category
{
    public long CategoryId { get; set; }
    public long? ParentCategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public Category? ParentCategory { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}