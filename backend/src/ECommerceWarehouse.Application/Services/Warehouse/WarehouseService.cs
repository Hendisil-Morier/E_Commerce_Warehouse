using ECommerceWarehouse.Application.Contracts.Persistence;
using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Warehouse;
using ECommerceWarehouse.Domain.Exceptions;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class WarehouseService : IWarehouseService
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<WarehouseQueryDto> _queryValidator;
    private readonly IValidator<CreateWarehouseRequestDto> _createWarehouseValidator;
    private readonly IValidator<CreateWarehouseLocationRequestDto> _createLocationValidator;

    public WarehouseService(
        IWarehouseRepository warehouseRepository,
        IUnitOfWork unitOfWork,
        IValidator<WarehouseQueryDto> queryValidator,
        IValidator<CreateWarehouseRequestDto> createWarehouseValidator,
        IValidator<CreateWarehouseLocationRequestDto> createLocationValidator)
    {
        _warehouseRepository = warehouseRepository;
        _unitOfWork = unitOfWork;
        _queryValidator = queryValidator;
        _createWarehouseValidator = createWarehouseValidator;
        _createLocationValidator = createLocationValidator;
    }

    public async Task<PagedResult<WarehouseDto>> GetWarehousesAsync(
        WarehouseQueryDto query,
        CancellationToken cancellationToken = default)
    {
        await _queryValidator.ValidateAndThrowAsync(query, cancellationToken);
        return await _warehouseRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<WarehouseDto> CreateWarehouseAsync(
        CreateWarehouseRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createWarehouseValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (request.WarehouseType == WarehouseTypes.Seller && request.OwnerSellerId.HasValue)
        {
            var sellerExists = await _warehouseRepository.SellerExistsAsync(request.OwnerSellerId.Value, cancellationToken);
            if (!sellerExists)
            {
                throw new NotFoundException("Seller", request.OwnerSellerId.Value);
            }
        }

        var warehouse = new Warehouse
        {
            WarehouseName = request.WarehouseName.Trim(),
            WarehouseType = request.WarehouseType,
            OwnerSellerId = request.WarehouseType == WarehouseTypes.Seller ? request.OwnerSellerId : null,
            Address = request.Address.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _warehouseRepository.AddWarehouseAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new WarehouseDto
        {
            WarehouseId = warehouse.WarehouseId,
            WarehouseName = warehouse.WarehouseName,
            WarehouseType = warehouse.WarehouseType,
            OwnerSellerId = warehouse.OwnerSellerId,
            Address = warehouse.Address,
            IsActive = warehouse.IsActive,
            LocationCount = 0,
            CreatedAt = warehouse.CreatedAt,
            UpdatedAt = warehouse.UpdatedAt
        };
    }

    public async Task<List<WarehouseLocationDto>> GetLocationsAsync(
        long warehouseId,
        CancellationToken cancellationToken = default)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(warehouseId, cancellationToken)
            ?? throw new NotFoundException("Warehouse", warehouseId);

        return await _warehouseRepository.GetLocationsAsync(warehouse.WarehouseId, cancellationToken);
    }

    public async Task<WarehouseLocationDto> CreateLocationAsync(
        long warehouseId,
        CreateWarehouseLocationRequestDto request,
        CancellationToken cancellationToken = default)
    {
        await _createLocationValidator.ValidateAndThrowAsync(request, cancellationToken);

        var warehouse = await _warehouseRepository.GetByIdAsync(warehouseId, cancellationToken)
            ?? throw new NotFoundException("Warehouse", warehouseId);

        var normalizedCode = request.LocationCode.Trim().ToUpperInvariant();
        if (await _warehouseRepository.LocationCodeExistsAsync(warehouse.WarehouseId, normalizedCode, cancellationToken))
        {
            throw new BusinessException(
                ErrorCodes.InvalidLocation,
                $"Mã vị trí kệ '{normalizedCode}' đã tồn tại trong kho này.",
                409);
        }

        var isNonSellableZone = StorageTypes.NonSellableOnly.Contains(request.StorageType);
        if (isNonSellableZone && request.IsSellable)
        {
            throw new BusinessException(
                ErrorCodes.InvalidLocation,
                $"Khu vực '{request.StorageType}' là khu cách ly, không thể bật trạng thái bán được (IsSellable).",
                400);
        }

        var location = new WarehouseLocation
        {
            WarehouseId = warehouse.WarehouseId,
            LocationCode = normalizedCode,
            StorageType = request.StorageType,
            IsSellable = !isNonSellableZone && request.IsSellable,
            IsActive = true
        };

        await _warehouseRepository.AddLocationAsync(location, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new WarehouseLocationDto
        {
            LocationId = location.LocationId,
            WarehouseId = location.WarehouseId,
            LocationCode = location.LocationCode,
            StorageType = location.StorageType,
            IsSellable = location.IsSellable,
            IsActive = location.IsActive
        };
    }

    public async Task<WarehouseDto> UpdateWarehouseAsync(
        long warehouseId,
        UpdateWarehouseRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(warehouseId, cancellationToken)
            ?? throw new NotFoundException("Warehouse", warehouseId);

        var name = request.WarehouseName?.Trim() ?? string.Empty;
        var address = request.Address?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(address))
        {
            throw new BusinessException(ErrorCodes.ValidationError, "Tên và địa chỉ kho không được để trống.", 400);
        }

        warehouse.WarehouseName = name;
        warehouse.Address = address;
        warehouse.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new WarehouseDto
        {
            WarehouseId = warehouse.WarehouseId,
            WarehouseName = warehouse.WarehouseName,
            WarehouseType = warehouse.WarehouseType,
            OwnerSellerId = warehouse.OwnerSellerId,
            OwnerSellerName = warehouse.OwnerSeller?.BusinessName,
            Address = warehouse.Address,
            IsActive = warehouse.IsActive,
            LocationCount = warehouse.Locations.Count,
            CreatedAt = warehouse.CreatedAt,
            UpdatedAt = warehouse.UpdatedAt
        };
    }

    public async Task<WarehouseDto> SetWarehouseStatusAsync(
        long warehouseId,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(warehouseId, cancellationToken)
            ?? throw new NotFoundException("Warehouse", warehouseId);

        warehouse.IsActive = isActive;
        warehouse.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new WarehouseDto
        {
            WarehouseId = warehouse.WarehouseId,
            WarehouseName = warehouse.WarehouseName,
            WarehouseType = warehouse.WarehouseType,
            OwnerSellerId = warehouse.OwnerSellerId,
            OwnerSellerName = warehouse.OwnerSeller?.BusinessName,
            Address = warehouse.Address,
            IsActive = warehouse.IsActive,
            LocationCount = warehouse.Locations.Count,
            CreatedAt = warehouse.CreatedAt,
            UpdatedAt = warehouse.UpdatedAt
        };
    }

    public async Task<WarehouseLocationDto> SetLocationStatusAsync(
        long locationId,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var location = await _warehouseRepository.GetLocationForUpdateAsync(locationId, cancellationToken)
            ?? throw new NotFoundException("WarehouseLocation", locationId);

        if (!isActive && await _warehouseRepository.LocationHasStockAsync(locationId, cancellationToken))
        {
            throw new BusinessException(
                ErrorCodes.BusinessRuleViolation,
                "Không thể tắt vị trí kệ khi vẫn còn hàng tồn kho hoặc đang giữ chỗ.",
                409);
        }

        location.IsActive = isActive;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new WarehouseLocationDto
        {
            LocationId = location.LocationId,
            WarehouseId = location.WarehouseId,
            LocationCode = location.LocationCode,
            StorageType = location.StorageType,
            IsSellable = location.IsSellable,
            IsActive = location.IsActive
        };
    }
}
