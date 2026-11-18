using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Validators.Catalog;
using FluentValidation;

namespace ECommerceWarehouse.Application.Services;

public class SellerMediaService : ISellerMediaService
{
    private readonly IApprovedSellerResolver _approvedSellerResolver;
    private readonly IFileStorageService _fileStorageService;
    private readonly IValidator<UploadImageInput> _validator;
    private readonly FileStorageOptions _options;

    public SellerMediaService(
        IApprovedSellerResolver approvedSellerResolver,
        IFileStorageService fileStorageService,
        IValidator<UploadImageInput> validator,
        FileStorageOptions options)
    {
        _approvedSellerResolver = approvedSellerResolver;
        _fileStorageService = fileStorageService;
        _validator = validator;
        _options = options;
    }

    public async Task<ImageUploadResponseDto> UploadProductImageAsync(
        UploadImageInput input,
        CancellationToken cancellationToken = default)
    {
        MemoryStream? bufferedStream = null;
        var workingInput = input;

        try
        {
            if (input.Content != null && !input.Content.CanSeek)
            {
                bufferedStream = await CopyBoundedStreamAsync(input.Content, cancellationToken);
                workingInput = new UploadImageInput
                {
                    FileName = input.FileName,
                    ContentType = input.ContentType,
                    SizeBytes = bufferedStream.Length,
                    Content = bufferedStream
                };
            }

            await _validator.ValidateAndThrowAsync(workingInput, cancellationToken);
            await _approvedSellerResolver.RequireApprovedSellerAsync(cancellationToken);

            ImageFileFormatHelper.TryGetExpectedFormat(workingInput.FileName, workingInput.ContentType, out var format);
            var canonicalExtension = ImageFileFormatHelper.GetCanonicalExtension(format);
            var canonicalContentType = ImageFileFormatHelper.GetCanonicalContentType(format);

            workingInput.Content!.Position = 0;
            var stored = await _fileStorageService.SaveProductImageAsync(
                workingInput.Content,
                canonicalExtension,
                cancellationToken);

            return new ImageUploadResponseDto
            {
                Url = stored.Url,
                FileName = stored.FileName,
                ContentType = canonicalContentType,
                SizeBytes = stored.SizeBytes
            };
        }
        finally
        {
            if (bufferedStream != null)
            {
                await bufferedStream.DisposeAsync();
            }
        }
    }

    private async Task<MemoryStream> CopyBoundedStreamAsync(Stream source, CancellationToken cancellationToken)
    {
        var maxBytes = _options.MaxImageSizeBytes > 0 ? _options.MaxImageSizeBytes : 5 * 1024 * 1024;
        var cap = maxBytes + 1;
        var buffer = new byte[8192];
        var memory = new MemoryStream();
        long total = 0;

        while (total < cap)
        {
            var toRead = (int)Math.Min(buffer.Length, cap - total);
            var read = await source.ReadAsync(buffer.AsMemory(0, toRead), cancellationToken);
            if (read == 0)
            {
                break;
            }

            await memory.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            total += read;
        }

        memory.Position = 0;
        return memory;
    }
}

