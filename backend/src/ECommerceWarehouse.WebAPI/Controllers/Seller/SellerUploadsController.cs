using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Seller;

[ApiController]
[Route("api/v1/seller/uploads")]
[Authorize(Policy = RoleNames.Seller)]
public class SellerUploadsController : ControllerBase
{
    private readonly ISellerMediaService _sellerMediaService;

    public SellerUploadsController(ISellerMediaService sellerMediaService)
    {
        _sellerMediaService = sellerMediaService;
    }

    public sealed class UploadImageFormRequest
    {
        public IFormFile? File { get; set; }
    }

    /// <summary>
    /// Tải lên ảnh sản phẩm/logo shop (chỉ nhận jpg, png, webp) và trả về URL truy cập
    /// </summary>
    [HttpPost("images")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ImageUploadResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ImageUploadResponseDto>> UploadImage(
        [FromForm] UploadImageFormRequest form,
        CancellationToken cancellationToken)
    {
        await using var stream = form.File?.OpenReadStream();
        var input = new UploadImageInput
        {
            FileName = form.File?.FileName ?? string.Empty,
            ContentType = form.File?.ContentType ?? string.Empty,
            SizeBytes = form.File?.Length ?? 0,
            Content = stream
        };

        var result = await _sellerMediaService.UploadProductImageAsync(input, cancellationToken);
        return Created(result.Url, result);
    }
}

