using ECommerceWarehouse.Application.Contracts.Services;
using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Application.Validators.Catalog;
using ECommerceWarehouse.Domain.Enums;
using ECommerceWarehouse.Domain.Exceptions;
using ECommerceWarehouse.Infrastructure.Services;
using FluentValidation;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.UnitTests.Services;

public sealed class SellerMediaServiceTests : IDisposable
{
    private readonly string _tempRoot = Path.Combine(
        Path.GetTempPath(),
        "ECommerceWarehouseTests",
        Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            Directory.Delete(_tempRoot, recursive: true);
        }
    }

    private sealed class FakeApprovedSellerResolver : IApprovedSellerResolver
    {
        public SellerStatus StatusToSimulate { get; set; } = SellerStatus.Approved;

        public Task<DomainSeller> RequireApprovedSellerAsync(CancellationToken cancellationToken = default)
        {
            if (StatusToSimulate != SellerStatus.Approved)
            {
                throw BusinessException.SellerNotApproved();
            }

            return Task.FromResult(new DomainSeller
            {
                SellerId = 1,
                UserId = 10,
                BusinessName = "Approved Store",
                Status = SellerStatus.Approved
            });
        }
    }

    private sealed class NonSeekableStream : Stream
    {
        private readonly MemoryStream _inner;
        public NonSeekableStream(byte[] bytes) => _inner = new MemoryStream(bytes);
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
        public override void Flush() => _inner.Flush();
        public override int Read(byte[] buffer, int offset, int count) => _inner.Read(buffer, offset, count);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
            => _inner.ReadAsync(buffer, cancellationToken);
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
        protected override void Dispose(bool disposing)
        {
            if (disposing) _inner.Dispose();
            base.Dispose(disposing);
        }
    }

    private FileStorageOptions CreateOptions(long maxSizeBytes = 1024 * 1024) => new()
    {
        UploadRootPath = _tempRoot,
        RequestPath = "/uploads",
        MaxImageSizeBytes = maxSizeBytes,
        ResolvedRootPath = _tempRoot
    };

    private SellerMediaService CreateService(
        FileStorageOptions options,
        FakeApprovedSellerResolver? resolver = null)
    {
        return new SellerMediaService(
            resolver ?? new FakeApprovedSellerResolver(),
            new LocalFileStorageService(options),
            new UploadImageInputValidator(options),
            options);
    }

    public static IEnumerable<object[]> ValidImageHeaders()
    {
        yield return ["photo.JPEG", "image/jpeg", new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 }, ".jpg", "image/jpeg"];
        yield return ["avatar.png", "image/png", new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01 }, ".png", "image/png"];
        yield return ["banner.webp", "image/webp", new byte[] { (byte)'R', (byte)'I', (byte)'F', (byte)'F', 0x12, 0x00, 0x00, 0x00, (byte)'W', (byte)'E', (byte)'B', (byte)'P' }, ".webp", "image/webp"];
        yield return ["cli-upload.jpg", "application/octet-stream", new byte[] { 0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x00 }, ".jpg", "image/jpeg"];
    }

    [Theory]
    [MemberData(nameof(ValidImageHeaders))]
    public async Task UploadProductImage_ValidFormats_SavesWithRandomNameAndReturnsUrl(
        string fileName,
        string contentType,
        byte[] contentBytes,
        string expectedExtension,
        string expectedContentType)
    {
        var options = CreateOptions();
        var service = CreateService(options);
        await using var stream = new MemoryStream(contentBytes);

        var result = await service.UploadProductImageAsync(new UploadImageInput
        {
            FileName = fileName,
            ContentType = contentType,
            SizeBytes = contentBytes.Length,
            Content = stream
        });

        Assert.StartsWith("/uploads/products/", result.Url);
        Assert.EndsWith(expectedExtension, result.FileName);
        Assert.DoesNotContain(Path.GetFileNameWithoutExtension(fileName), result.FileName);
        Assert.Equal(expectedContentType, result.ContentType);
        Assert.Equal(contentBytes.Length, result.SizeBytes);

        var relativeSubPath = result.Url["/uploads/".Length..].Replace('/', Path.DirectorySeparatorChar);
        var fullFilePath = Path.Combine(_tempRoot, relativeSubPath);
        Assert.True(File.Exists(fullFilePath));
        Assert.Equal(contentBytes, await File.ReadAllBytesAsync(fullFilePath));
    }

    [Fact]
    public async Task UploadProductImage_NonSeekableStream_BuffersSafelyAndSaves()
    {
        var options = CreateOptions();
        var service = CreateService(options);
        var bytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0xAA, 0xBB };
        await using var stream = new NonSeekableStream(bytes);

        var result = await service.UploadProductImageAsync(new UploadImageInput
        {
            FileName = "nonseek.png",
            ContentType = "image/png",
            SizeBytes = bytes.Length,
            Content = stream
        });

        Assert.EndsWith(".png", result.FileName);
        Assert.Equal(bytes.Length, result.SizeBytes);
    }

    [Fact]
    public async Task UploadProductImage_ExeFileOrDisguisedExeAsJpg_ThrowsValidationException()
    {
        var options = CreateOptions();
        var service = CreateService(options);
        var mzExecutableHeader = new byte[] { 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00 };

        await using var exeStream = new MemoryStream(mzExecutableHeader);
        await Assert.ThrowsAsync<ValidationException>(() => service.UploadProductImageAsync(new UploadImageInput
        {
            FileName = "malware.exe",
            ContentType = "application/x-msdownload",
            SizeBytes = mzExecutableHeader.Length,
            Content = exeStream
        }));

        await using var disguisedStream = new MemoryStream(mzExecutableHeader);
        await Assert.ThrowsAsync<ValidationException>(() => service.UploadProductImageAsync(new UploadImageInput
        {
            FileName = "disguised.jpg",
            ContentType = "image/jpeg",
            SizeBytes = mzExecutableHeader.Length,
            Content = disguisedStream
        }));
    }

    [Fact]
    public async Task UploadProductImage_ExceedsMaxSize_ThrowsValidationException()
    {
        var options = CreateOptions(maxSizeBytes: 10);
        var service = CreateService(options);
        var oversizedJpg = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 4, 5, 6, 7 };

        await using var stream = new MemoryStream(oversizedJpg);
        await Assert.ThrowsAsync<ValidationException>(() => service.UploadProductImageAsync(new UploadImageInput
        {
            FileName = "big.jpg",
            ContentType = "image/jpeg",
            SizeBytes = oversizedJpg.Length,
            Content = stream
        }));
    }

    [Fact]
    public async Task UploadProductImage_UnapprovedSeller_ThrowsSellerNotApproved()
    {
        var options = CreateOptions();
        var service = CreateService(options, new FakeApprovedSellerResolver { StatusToSimulate = SellerStatus.Suspended });
        var validPng = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

        await using var stream = new MemoryStream(validPng);
        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.UploadProductImageAsync(new UploadImageInput
        {
            FileName = "ok.png",
            ContentType = "image/png",
            SizeBytes = validPng.Length,
            Content = stream
        }));

        Assert.Equal(ErrorCodes.SellerNotApproved, ex.Code);
        Assert.Equal(409, ex.HttpStatus);
    }
}

