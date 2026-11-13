using ECommerceWarehouse.Application.Contracts.Services;

namespace ECommerceWarehouse.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedCanonicalExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".png",
        ".webp"
    };

    private readonly FileStorageOptions _options;

    public LocalFileStorageService(FileStorageOptions options)
    {
        _options = options;
    }

    public async Task<StoredFileResult> SaveProductImageAsync(
        Stream content,
        string canonicalExtension,
        CancellationToken cancellationToken = default)
    {
        if (!AllowedCanonicalExtensions.Contains(canonicalExtension))
        {
            throw new ArgumentException($"Phần mở rộng tệp không được hỗ trợ: {canonicalExtension}", nameof(canonicalExtension));
        }

        var now = DateTime.UtcNow;
        var yearSegment = now.ToString("yyyy");
        var monthSegment = now.ToString("MM");
        var randomFileName = $"{Guid.NewGuid():N}{canonicalExtension.ToLowerInvariant()}";

        var rootFullPath = Path.GetFullPath(_options.ResolvedRootPath);
        var targetDirectory = Path.GetFullPath(Path.Combine(rootFullPath, "products", yearSegment, monthSegment));
        var destinationPath = Path.GetFullPath(Path.Combine(targetDirectory, randomFileName));

        if (!destinationPath.StartsWith(rootFullPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Đường dẫn lưu tệp không hợp lệ.");
        }

        Directory.CreateDirectory(targetDirectory);

        long writtenBytes;
        await using (var output = new FileStream(
            destinationPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true))
        {
            await content.CopyToAsync(output, cancellationToken);
            writtenBytes = output.Length;
        }

        var url = $"{_options.NormalizedRequestPath}/products/{yearSegment}/{monthSegment}/{randomFileName}";
        return new StoredFileResult(randomFileName, url, writtenBytes);
    }
}

