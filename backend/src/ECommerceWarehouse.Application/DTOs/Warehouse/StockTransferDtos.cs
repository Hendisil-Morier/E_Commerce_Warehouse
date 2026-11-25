using ECommerceWarehouse.Application.DTOs.Common;
using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class StockTransferQueryDto : PaginationQuery
{
    public long? SourceWarehouseId { get; set; }
    public long? DestinationWarehouseId { get; set; }
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class StockTransferListItemDto
{
    public long TransferId { get; set; }
    public long SourceWarehouseId { get; set; }
    public string SourceWarehouseName { get; set; } = null!;
    public long DestinationWarehouseId { get; set; }
    public string DestinationWarehouseName { get; set; } = null!;
    public string TransferCode { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? Note { get; set; }
    public int TotalQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
}

public class StockTransferDetailDto : StockTransferListItemDto
{
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public long? ReceivedBy { get; set; }
    public List<StockTransferLineDto> Details { get; set; } = [];
}

public class StockTransferLineDto
{
    public long TransferDetailId { get; set; }
    public long VariantId { get; set; }
    public string SKU { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public long SourceLocationId { get; set; }
    public string SourceLocationCode { get; set; } = null!;
    public long? DestinationLocationId { get; set; }
    public string? DestinationLocationCode { get; set; }
    public int Quantity { get; set; }
    public int? ReceivedQuantity { get; set; }
}

public class CreateStockTransferRequestDto
{
    public long SourceWarehouseId { get; set; }
    public long DestinationWarehouseId { get; set; }
    public string? Note { get; set; }
    public List<CreateStockTransferItemDto> Items { get; set; } = [];
}

public class CreateStockTransferItemDto
{
    public long VariantId { get; set; }
    public long SourceLocationId { get; set; }
    public long DestinationLocationId { get; set; }
    public int Quantity { get; set; }
}

public class ReceiveStockTransferRequestDto
{
    public List<ReceiveStockTransferItemDto> Items { get; set; } = [];
}

public class ReceiveStockTransferItemDto
{
    public long TransferDetailId { get; set; }
    public long? DestinationLocationId { get; set; }
    public int ReceivedQuantity { get; set; }
}

public class CreateStockTransferRequestValidator : AbstractValidator<CreateStockTransferRequestDto>
{
    public CreateStockTransferRequestValidator()
    {
        RuleFor(x => x.SourceWarehouseId).GreaterThan(0);
        RuleFor(x => x.DestinationWarehouseId).GreaterThan(0);
        RuleFor(x => x.Note).MaximumLength(500);
        RuleFor(x => x.Items).NotEmpty().WithMessage("Phiếu điều chuyển phải có ít nhất 1 dòng.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.VariantId).GreaterThan(0);
            item.RuleFor(i => i.SourceLocationId).GreaterThan(0);
            item.RuleFor(i => i.DestinationLocationId).GreaterThan(0);
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}

public class ReceiveStockTransferRequestValidator : AbstractValidator<ReceiveStockTransferRequestDto>
{
    public ReceiveStockTransferRequestValidator()
    {
        RuleFor(x => x.Items).NotEmpty().WithMessage("Danh sách nhận điều chuyển không được trống.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.TransferDetailId).GreaterThan(0);
            item.RuleFor(i => i.ReceivedQuantity).GreaterThan(0);
        });
    }
}
