namespace ECommerceWarehouse.Application.DTOs.Catalog;

public class UploadImageInput
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public Stream? Content { get; init; }
}

public class ImageUploadResponseDto
{
    public string Url { get; init; } = null!;
    public string FileName { get; init; } = null!;
    public string ContentType { get; init; } = null!;
    public long SizeBytes { get; init; }
}

