namespace ECommerceWarehouse.Application.Contracts.Services;

/// <summary>
/// Cấu hình lưu trữ và phục vụ ảnh upload từ người bán.
/// </summary>
public class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string UploadRootPath { get; init; } = "wwwroot/uploads";
    public string RequestPath { get; init; } = "/uploads";
    public long MaxImageSizeBytes { get; init; } = 5 * 1024 * 1024;
    public string ResolvedRootPath { get; init; } = Path.GetFullPath(Path.Combine("wwwroot", "uploads"));

    public string NormalizedRequestPath
    {
        get
        {
            var trimmed = string.IsNullOrWhiteSpace(RequestPath) ? "/uploads" : RequestPath.Trim();
            if (!trimmed.StartsWith('/'))
            {
                trimmed = "/" + trimmed;
            }

            return trimmed.TrimEnd('/');
        }
    }
}

