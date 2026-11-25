using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using ECommerceWarehouse.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/categories")]
[Authorize(Policy = RoleNames.Admin)]
public class AdminCategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public AdminCategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Danh sách toàn bộ danh mục (bao gồm cả danh mục đang ẩn) cho Admin
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminCategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<AdminCategoryDto>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _categoryService.GetAdminCategoriesAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Tạo mới danh mục ngành hàng
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AdminCategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminCategoryDto>> Create(
        [FromBody] CreateCategoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var created = await _categoryService.CreateCategoryAsync(request, cancellationToken);
        return Created($"/api/v1/admin/categories/{created.CategoryId}", created);
    }

    /// <summary>
    /// Cập nhật tên, mô tả hoặc danh mục cha
    /// </summary>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(AdminCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminCategoryDto>> Update(
        long id,
        [FromBody] UpdateCategoryRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _categoryService.UpdateCategoryAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    /// <summary>
    /// Ẩn / Hiện danh mục (chặn ẩn nếu danh mục đang có sản phẩm)
    /// </summary>
    [HttpPatch("{id:long}/status")]
    [ProducesResponseType(typeof(AdminCategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminCategoryDto>> UpdateStatus(
        long id,
        [FromBody] UpdateCategoryStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _categoryService.UpdateCategoryStatusAsync(id, request, cancellationToken);
        return Ok(updated);
    }
}
