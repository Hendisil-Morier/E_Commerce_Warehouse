using ECommerceWarehouse.Application.DTOs.Catalog;

namespace ECommerceWarehouse.Application.Services;

public interface ISellerMediaService
{
    Task<ImageUploadResponseDto> UploadProductImageAsync(
        UploadImageInput input,
        CancellationToken cancellationToken = default);
}

