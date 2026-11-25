using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class InventoryLedgerService : IInventoryLedgerService
{
    private readonly IInventoryRepository _inventoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUser _currentUser;
    private readonly IValidator<InventoryQueryDto> _inventoryQueryValidator;
    private readonly IValidator<StockMovementQueryDto> _movementQueryValidator;

    public InventoryLedgerService(
        IInventoryRepository inventoryRepository,
        IUnitOfWork unitOfWork,
        ICurrentUser currentUser,
        IValidator<InventoryQueryDto> inventoryQueryValidator,
        IValidator<StockMovementQueryDto> movementQueryValidator)
    {
        _inventoryRepository = inventoryRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _inventoryQueryValidator = inventoryQueryValidator;
        _movementQueryValidator = movementQueryValidator;
    }

    public async Task IncreaseOnHandAsync(
        long warehouseId,
        long locationId,
        long variantId,
        int quantity,
        string movementType,
        string referenceType,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Số lượng tăng tồn phải lớn hơn 0.", 400);
        }

        var inventory = await _inventoryRepository.GetByLocationAndVariantAsync(locationId, variantId, cancellationToken);
        if (inventory == null)
        {
            inventory = new Inventory
            {
                WarehouseId = warehouseId,
                LocationId = locationId,
                VariantId = variantId,
                QuantityOnHand = quantity,
                QuantityReserved = 0,
                UpdatedAt = DateTime.UtcNow
            };
            await _inventoryRepository.AddInventoryAsync(inventory, cancellationToken);
        }
        else
        {
            inventory.QuantityOnHand += quantity;
            inventory.UpdatedAt = DateTime.UtcNow;
        }

        var movement = new StockMovement
        {
            WarehouseId = warehouseId,
            LocationId = locationId,
            VariantId = variantId,
            MovementType = movementType,
            OnHandChange = quantity,
            ReservedChange = 0,
            OnHandAfter = inventory.QuantityOnHand,
            ReservedAfter = inventory.QuantityReserved,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Note = note
        };

        await _inventoryRepository.AddStockMovementAsync(movement, cancellationToken);
    }

    public async Task AdjustOnHandAsync(
        long warehouseId,
        long locationId,
        long variantId,
        int deltaQuantity,
        string movementType,
        string referenceType,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (deltaQuantity == 0)
        {
            return;
        }

        if (deltaQuantity > 0)
        {
            await IncreaseOnHandAsync(
                warehouseId,
                locationId,
                variantId,
                deltaQuantity,
                movementType,
                referenceType,
                referenceId,
                createdBy,
                note,
                cancellationToken);
            return;
        }

        var decreaseQty = -deltaQuantity;
        var inventory = await _inventoryRepository.GetByLocationAndVariantAsync(locationId, variantId, cancellationToken)
            ?? throw new NotFoundException("Inventory", $"{locationId}-{variantId}");

        if (inventory.QuantityOnHand - inventory.QuantityReserved < decreaseQty)
        {
            throw new BusinessException(
                ErrorCodes.InsufficientStock,
                $"Số lượng khả dụng tại vị trí #{locationId} không đủ để giảm {decreaseQty} đơn vị.",
                409);
        }

        inventory.QuantityOnHand -= decreaseQty;
        inventory.UpdatedAt = DateTime.UtcNow;

        await _inventoryRepository.AddStockMovementAsync(new StockMovement
        {
            WarehouseId = warehouseId,
            LocationId = locationId,
            VariantId = variantId,
            MovementType = movementType,
            OnHandChange = deltaQuantity,
            ReservedChange = 0,
            OnHandAfter = inventory.QuantityOnHand,
            ReservedAfter = inventory.QuantityReserved,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Note = note
        }, cancellationToken);
    }

    public async Task ReserveStockAtomicAsync(
        long inventoryId,
        int quantity,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Số lượng giữ chỗ phải lớn hơn 0.", 400);
        }

        var affected = await _inventoryRepository.TryReserveAtomicAsync(inventoryId, quantity, cancellationToken);
        if (affected == 0)
        {
            throw new BusinessException(
                ErrorCodes.InsufficientStock,
                "Sản phẩm không đủ tồn kho khả dụng để giữ chỗ.",
                409);
        }

        var updatedInventory = await _inventoryRepository.GetByIdAsync(inventoryId, cancellationToken)
            ?? throw new NotFoundException("Inventory", inventoryId);

        var movement = new StockMovement
        {
            WarehouseId = updatedInventory.WarehouseId,
            LocationId = updatedInventory.LocationId,
            VariantId = updatedInventory.VariantId,
            MovementType = StockMovementTypes.Reserve,
            OnHandChange = 0,
            ReservedChange = quantity,
            OnHandAfter = updatedInventory.QuantityOnHand,
            ReservedAfter = updatedInventory.QuantityReserved,
            ReferenceType = StockReferenceTypes.Reservation,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Note = note
        };

        await _inventoryRepository.AddStockMovementAsync(movement, cancellationToken);
    }

    public async Task ReleaseReservationAsync(
        long locationId,
        long variantId,
        int quantity,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Số lượng nhả giữ chỗ phải lớn hơn 0.", 400);
        }

        var inventory = await _inventoryRepository.GetByLocationAndVariantAsync(locationId, variantId, cancellationToken)
            ?? throw new NotFoundException("Inventory", $"{locationId}-{variantId}");

        if (inventory.QuantityReserved < quantity)
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Số lượng giữ chỗ hiện tại nhỏ hơn số lượng cần nhả.",
                409);
        }

        inventory.QuantityReserved -= quantity;
        inventory.UpdatedAt = DateTime.UtcNow;

        var movement = new StockMovement
        {
            WarehouseId = inventory.WarehouseId,
            LocationId = inventory.LocationId,
            VariantId = inventory.VariantId,
            MovementType = StockMovementTypes.ReleaseReserve,
            OnHandChange = 0,
            ReservedChange = -quantity,
            OnHandAfter = inventory.QuantityOnHand,
            ReservedAfter = inventory.QuantityReserved,
            ReferenceType = StockReferenceTypes.Reservation,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Note = note
        };

        await _inventoryRepository.AddStockMovementAsync(movement, cancellationToken);
    }

    public async Task DispatchReservedStockAsync(
        long locationId,
        long variantId,
        int quantity,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Số lượng xuất kho phải lớn hơn 0.", 400);
        }

        var inventory = await _inventoryRepository.GetByLocationAndVariantAsync(locationId, variantId, cancellationToken)
            ?? throw new NotFoundException("Inventory", $"{locationId}-{variantId}");

        if (inventory.QuantityOnHand < quantity || inventory.QuantityReserved < quantity)
        {
            throw new BusinessException(
                ErrorCodes.InsufficientStock,
                "Tồn thực hoặc tồn giữ chỗ không đủ để xuất kho.",
                409);
        }

        inventory.QuantityOnHand -= quantity;
        inventory.QuantityReserved -= quantity;
        inventory.UpdatedAt = DateTime.UtcNow;

        var movement = new StockMovement
        {
            WarehouseId = inventory.WarehouseId,
            LocationId = inventory.LocationId,
            VariantId = inventory.VariantId,
            MovementType = StockMovementTypes.Issue,
            OnHandChange = -quantity,
            ReservedChange = -quantity,
            OnHandAfter = inventory.QuantityOnHand,
            ReservedAfter = inventory.QuantityReserved,
            ReferenceType = StockReferenceTypes.Issue,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Note = note
        };

        await _inventoryRepository.AddStockMovementAsync(movement, cancellationToken);
    }

    public async Task TransferAdjustmentAsync(
        long warehouseId,
        long sourceLocationId,
        long destinationLocationId,
        long variantId,
        int quantity,
        string referenceType,
        long referenceId,
        long? createdBy,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (quantity <= 0)
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Số lượng điều chuyển phải lớn hơn 0.", 400);
        }

        var sourceInventory = await _inventoryRepository.GetByLocationAndVariantAsync(sourceLocationId, variantId, cancellationToken)
            ?? throw new NotFoundException("Inventory", $"{sourceLocationId}-{variantId}");

        if (sourceInventory.QuantityOnHand - sourceInventory.QuantityReserved < quantity)
        {
            throw new BusinessException(
                ErrorCodes.InsufficientStock,
                "Số lượng hàng tại khu chờ kiểm định không đủ để điều chỉnh chuyển kệ.",
                409);
        }

        sourceInventory.QuantityOnHand -= quantity;
        sourceInventory.UpdatedAt = DateTime.UtcNow;

        await _inventoryRepository.AddStockMovementAsync(new StockMovement
        {
            WarehouseId = warehouseId,
            LocationId = sourceLocationId,
            VariantId = variantId,
            MovementType = StockMovementTypes.Adjustment,
            OnHandChange = -quantity,
            ReservedChange = 0,
            OnHandAfter = sourceInventory.QuantityOnHand,
            ReservedAfter = sourceInventory.QuantityReserved,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Note = note
        }, cancellationToken);

        await IncreaseOnHandAsync(
            warehouseId,
            destinationLocationId,
            variantId,
            quantity,
            StockMovementTypes.Adjustment,
            referenceType,
            referenceId,
            createdBy,
            note,
            cancellationToken);
    }

    public async Task<PagedResult<InventoryItemDto>> GetInventoryAsync(
        InventoryQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _inventoryQueryValidator.ValidateAndThrowAsync(query, cancellationToken);

        long? restrictedSellerId = null;
        var isWarehouseRole = _currentUser.IsInRole(RoleNames.WarehouseManager)
                              || _currentUser.IsInRole(RoleNames.WarehouseStaff)
                              || _currentUser.IsInRole(RoleNames.Admin);

        if (!isWarehouseRole && _currentUser.IsInRole(RoleNames.Seller))
        {
            restrictedSellerId = await _currentUser.GetSellerIdAsync(cancellationToken)
                ?? throw BusinessException.Forbidden("Không tìm thấy hồ sơ người bán cho tài khoản hiện tại.");
        }

        return await _inventoryRepository.GetPagedInventoryAsync(query, restrictedSellerId, cancellationToken);
    }

    public async Task<VariantAvailabilityDto> GetVariantAvailabilityAsync(
        long variantId,
        CancellationToken cancellationToken = default)
    {
        return await _inventoryRepository.GetVariantAvailabilityAsync(variantId, cancellationToken);
    }

    public async Task<PagedResult<StockMovementDto>> GetStockMovementsAsync(
        StockMovementQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _movementQueryValidator.ValidateAndThrowAsync(query, cancellationToken);
        return await _inventoryRepository.GetPagedMovementsAsync(query, cancellationToken);
    }

    public async Task<List<StockReconciliationItemDto>> GetReconciliationDiscrepanciesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _inventoryRepository.GetReconciliationDiscrepanciesAsync(cancellationToken);
    }
}
