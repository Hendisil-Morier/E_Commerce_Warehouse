using ECommerceWarehouse.Application.DTOs.Common;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class WarehouseQueryDto : PaginationQuery
{
    public string? Search { get; set; }
    public string? WarehouseType { get; set; }
    public bool? IsActive { get; set; }
}

public class WarehouseDto
{
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string WarehouseType { get; set; } = null!;
    public long? OwnerSellerId { get; set; }
    public string? OwnerSellerName { get; set; }
    public string Address { get; set; } = null!;
    public bool IsActive { get; set; }
    public int LocationCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateWarehouseRequestDto
{
    public string WarehouseName { get; set; } = null!;
    public string WarehouseType { get; set; } = "Platform";
    public long? OwnerSellerId { get; set; }
    public string Address { get; set; } = null!;
}

public class WarehouseLocationDto
{
    public long LocationId { get; set; }
    public long WarehouseId { get; set; }
    public string LocationCode { get; set; } = null!;
    public string StorageType { get; set; } = null!;
    public bool IsSellable { get; set; }
    public bool IsActive { get; set; }
}

public class CreateWarehouseLocationRequestDto
{
    public string LocationCode { get; set; } = null!;
    public string StorageType { get; set; } = "Standard";
    public bool IsSellable { get; set; } = true;
}
