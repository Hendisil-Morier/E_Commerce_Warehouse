using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Warehouse;

public class WarehouseQueryValidator : AbstractValidator<WarehouseQueryDto>
{
    public WarehouseQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.WarehouseType)
            .Must(t => string.IsNullOrWhiteSpace(t) || WarehouseTypes.All.Contains(t))
            .WithMessage("Loại kho chỉ được là 'Platform' hoặc 'Seller'.");
    }
}

public class CreateWarehouseRequestValidator : AbstractValidator<CreateWarehouseRequestDto>
{
    public CreateWarehouseRequestValidator()
    {
        RuleFor(x => x.WarehouseName)
            .NotEmpty().WithMessage("Tên kho không được để trống.")
            .MaximumLength(200);

        RuleFor(x => x.WarehouseType)
            .NotEmpty()
            .Must(t => WarehouseTypes.All.Contains(t))
            .WithMessage("Loại kho chỉ được là 'Platform' hoặc 'Seller'.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Địa chỉ kho không được để trống.")
            .MaximumLength(500);

        RuleFor(x => x.OwnerSellerId)
            .NotNull()
            .When(x => x.WarehouseType == WarehouseTypes.Seller)
            .WithMessage("Kho riêng của Seller bắt buộc phải chỉ định OwnerSellerId.");

        RuleFor(x => x.OwnerSellerId)
            .Null()
            .When(x => x.WarehouseType == WarehouseTypes.Platform)
            .WithMessage("Kho sàn (Platform) không được gán OwnerSellerId.");
    }
}

public class CreateWarehouseLocationRequestValidator : AbstractValidator<CreateWarehouseLocationRequestDto>
{
    public CreateWarehouseLocationRequestValidator()
    {
        RuleFor(x => x.LocationCode)
            .NotEmpty().WithMessage("Mã vị trí kệ không được để trống.")
            .MaximumLength(50);

        RuleFor(x => x.StorageType)
            .NotEmpty()
            .Must(t => StorageTypes.All.Contains(t))
            .WithMessage("Loại khu vực lưu trữ không hợp lệ.");
    }
}

public class InventoryQueryValidator : AbstractValidator<InventoryQueryDto>
{
    public InventoryQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
    }
}

public class StockMovementQueryValidator : AbstractValidator<StockMovementQueryDto>
{
    public StockMovementQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
    }
}
