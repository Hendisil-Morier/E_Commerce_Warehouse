using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Catalog;

public static class ImageFileFormatHelper
{
    public enum ImageFormat
    {
        Jpeg,
        Png,
        Webp
    }

    private static readonly Dictionary<string, ImageFormat> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = ImageFormat.Jpeg,
        [".jpeg"] = ImageFormat.Jpeg,
        [".png"] = ImageFormat.Png,
        [".webp"] = ImageFormat.Webp
    };

    private static readonly Dictionary<string, ImageFormat> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ImageFormat.Jpeg,
        ["image/jpg"] = ImageFormat.Jpeg,
        ["image/pjpeg"] = ImageFormat.Jpeg,
        ["image/png"] = ImageFormat.Png,
        ["image/webp"] = ImageFormat.Webp
    };

    public static bool TryGetExpectedFormat(string? fileName, string? contentType, out ImageFormat format)
    {
        format = default;
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return false;
        }

        var extension = Path.GetExtension(fileName.Trim());
        if (!AllowedExtensions.TryGetValue(extension, out var extFormat))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(contentType))
        {
            var normalizedContentType = contentType.Split(';', 2)[0].Trim();
            if (!string.Equals(normalizedContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                if (!AllowedMimeTypes.TryGetValue(normalizedContentType, out var mimeFormat) ||
                    mimeFormat != extFormat)
                {
                    return false;
                }
            }
        }

        format = extFormat;
        return true;
    }

    public static string GetCanonicalExtension(ImageFormat format) => format switch
    {
        ImageFormat.Jpeg => ".jpg",
        ImageFormat.Png => ".png",
        ImageFormat.Webp => ".webp",
        _ => throw new ArgumentOutOfRangeException(nameof(format), format, null)
    };

    public static string GetCanonicalContentType(ImageFormat format) => format switch
    {
        ImageFormat.Jpeg => "image/jpeg",
        ImageFormat.Png => "image/png",
        ImageFormat.Webp => "image/webp",
        _ => throw new ArgumentOutOfRangeException(nameof(format), format, null)
    };

    public static bool HasValidMagicBytes(Stream? stream, ImageFormat expectedFormat)
    {
        if (stream == null || !stream.CanRead || !stream.CanSeek)
        {
            return false;
        }

        var originalPosition = stream.Position;
        try
        {
            stream.Position = 0;
            Span<byte> header = stackalloc byte[12];
            var totalRead = 0;
            while (totalRead < header.Length)
            {
                var read = stream.Read(header[totalRead..]);
                if (read == 0)
                {
                    break;
                }

                totalRead += read;
            }

            return expectedFormat switch
            {
                ImageFormat.Jpeg => totalRead >= 3 &&
                    header[0] == 0xFF &&
                    header[1] == 0xD8 &&
                    header[2] == 0xFF,

                ImageFormat.Png => totalRead >= 8 &&
                    header[0] == 0x89 &&
                    header[1] == 0x50 &&
                    header[2] == 0x4E &&
                    header[3] == 0x47 &&
                    header[4] == 0x0D &&
                    header[5] == 0x0A &&
                    header[6] == 0x1A &&
                    header[7] == 0x0A,

                ImageFormat.Webp => totalRead >= 12 &&
                    header[0] == (byte)'R' &&
                    header[1] == (byte)'I' &&
                    header[2] == (byte)'F' &&
                    header[3] == (byte)'F' &&
                    header[8] == (byte)'W' &&
                    header[9] == (byte)'E' &&
                    header[10] == (byte)'B' &&
                    header[11] == (byte)'P',

                _ => false
            };
        }
        finally
        {
            stream.Position = originalPosition;
        }
    }
}

public class UploadImageInputValidator : AbstractValidator<UploadImageInput>
{
    public UploadImageInputValidator(FileStorageOptions options)
    {
        var maxSizeBytes = options.MaxImageSizeBytes > 0 ? options.MaxImageSizeBytes : 5 * 1024 * 1024;
        var maxSizeMb = Math.Round(maxSizeBytes / (1024d * 1024d), 2);

        RuleFor(x => x.Content)
            .NotNull().WithMessage("Vui lòng chọn tệp ảnh cần tải lên.");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("Tên tệp ảnh không hợp lệ.");

        RuleFor(x => x.SizeBytes)
            .GreaterThan(0).WithMessage("Tệp ảnh không được rỗng.")
            .LessThanOrEqualTo(maxSizeBytes)
            .WithMessage($"Dung lượng ảnh không được vượt quá {maxSizeMb:0.##} MB.");

        RuleFor(x => x)
            .Must(x => ImageFileFormatHelper.TryGetExpectedFormat(x.FileName, x.ContentType, out _))
            .WithName("file")
            .WithMessage("Chỉ chấp nhận ảnh định dạng JPG, JPEG, PNG hoặc WebP.");

        RuleFor(x => x)
            .Must(x =>
                ImageFileFormatHelper.TryGetExpectedFormat(x.FileName, x.ContentType, out var format) &&
                ImageFileFormatHelper.HasValidMagicBytes(x.Content, format))
            .WithName("file")
            .WithMessage("Nội dung tệp không khớp định dạng ảnh hợp lệ (JPG, PNG, WebP).")
            .When(x => x.Content != null && x.SizeBytes > 0 && ImageFileFormatHelper.TryGetExpectedFormat(x.FileName, x.ContentType, out _));
    }
}
