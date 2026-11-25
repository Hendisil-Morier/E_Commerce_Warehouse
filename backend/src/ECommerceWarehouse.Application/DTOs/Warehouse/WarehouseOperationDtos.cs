using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Warehouse;

public class UpdateWarehouseRequestDto
{
    public string WarehouseName { get; set; } = null!;
    public string Address { get; set; } = null!;
}

public class UpdateWarehouseActiveStatusDto
{
    public bool IsActive { get; set; }
}

public class CancelIssueRequestDto
{
    public string Reason { get; set; } = null!;
}

public class PutawayRequestDto
{
    public long WarehouseId { get; set; }
    public long SourceLocationId { get; set; }
    public long DestinationLocationId { get; set; }
    public long VariantId { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class UpdateWarehouseRequestValidator : AbstractValidator<UpdateWarehouseRequestDto>
{
    public UpdateWarehouseRequestValidator()
    {
        RuleFor(x => x.WarehouseName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
    }
}

public class CancelIssueRequestValidator : AbstractValidator<CancelIssueRequestDto>
{
    public CancelIssueRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(300);
    }
}

public class PutawayRequestValidator : AbstractValidator<PutawayRequestDto>
{
    public PutawayRequestValidator()
    {
        RuleFor(x => x.WarehouseId).GreaterThan(0);
        RuleFor(x => x.SourceLocationId).GreaterThan(0);
        RuleFor(x => x.DestinationLocationId).GreaterThan(0);
        RuleFor(x => x.DestinationLocationId).NotEqual(x => x.SourceLocationId)
            .WithMessage("Vị trí đích phải khác vị trí nguồn.");
        RuleFor(x => x.VariantId).GreaterThan(0);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.Note).MaximumLength(300);
    }
}
