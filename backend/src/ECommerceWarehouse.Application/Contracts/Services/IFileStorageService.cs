namespace ECommerceWarehouse.Application.Contracts.Services;

/// <summary>
/// Dịch vụ lưu trữ tệp ảnh sản phẩm/shop xuống vùng lưu trữ an toàn và trả về URL truy cập.
/// </summary>
public interface IFileStorageService
{
    Task<StoredFileResult> SaveProductImageAsync(
        Stream content,
        string canonicalExtension,
        CancellationToken cancellationToken = default);
}

public sealed record StoredFileResult(string FileName, string Url, long SizeBytes);

