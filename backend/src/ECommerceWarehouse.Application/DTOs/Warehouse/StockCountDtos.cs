using ECommerceWarehouse.Application.DTOs.Common;
using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class StockCountQueryDto : PaginationQuery
{
    public long? WarehouseId { get; set; }
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class StockCountListItemDto
{
    public long StockCountId { get; set; }
    public long WarehouseId { get; set; }
    public string WarehouseName { get; set; } = null!;
    public string CountCode { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class StockCountDetailDto : StockCountListItemDto
{
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public List<StockCountLineDto> Details { get; set; } = [];
}

public class StockCountLineDto
{
    public long StockCountDetailId { get; set; }
    public long LocationId { get; set; }
    public string LocationCode { get; set; } = null!;
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public int SystemQuantity { get; set; }
    public int? CountedQuantity { get; set; }
    public int? Difference { get; set; }
    public string? Reason { get; set; }
}

public class CreateStockCountRequestDto
{
    public long WarehouseId { get; set; }
    public string? Note { get; set; }
    public List<CreateStockCountItemDto> Items { get; set; } = [];
}

public class CreateStockCountItemDto
{
    public long LocationId { get; set; }
    public long VariantId { get; set; }
}

public class RecordStockCountRequestDto
{
    public bool SubmitForApproval { get; set; } = true;
    public List<RecordStockCountItemDto> Items { get; set; } = [];
}

public class RecordStockCountItemDto
{
    public long StockCountDetailId { get; set; }
    public int CountedQuantity { get; set; }
    public string? Reason { get; set; }
}

public class CreateStockCountRequestValidator : AbstractValidator<CreateStockCountRequestDto>
{
    public CreateStockCountRequestValidator()
    {
        RuleFor(x => x.WarehouseId).GreaterThan(0);
        RuleFor(x => x.Note).MaximumLength(500);
        RuleFor(x => x.Items).NotEmpty().WithMessage("Phiếu kiểm kê phải có ít nhất 1 dòng.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.LocationId).GreaterThan(0);
            item.RuleFor(i => i.VariantId).GreaterThan(0);
        });
    }
}

public class RecordStockCountRequestValidator : AbstractValidator<RecordStockCountRequestDto>
{
    public RecordStockCountRequestValidator()
    {
        RuleFor(x => x.Items).NotEmpty().WithMessage("Danh sách số lượng kiểm kê không được trống.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.StockCountDetailId).GreaterThan(0);
            item.RuleFor(i => i.CountedQuantity).GreaterThanOrEqualTo(0);
            item.RuleFor(i => i.Reason).MaximumLength(300);
        });
    }
}
