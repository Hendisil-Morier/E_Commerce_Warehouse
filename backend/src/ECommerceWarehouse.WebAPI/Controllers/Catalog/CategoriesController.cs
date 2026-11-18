using ECommerceWarehouse.Application.DTOs.Catalog;
using ECommerceWarehouse.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers.Catalog;

[ApiController]
[Route("api/v1/categories")]
[AllowAnonymous]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Lấy cây danh mục sản phẩm công khai đang hoạt động
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CategoryTreeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryTreeDto>>> GetCategoryTree(CancellationToken cancellationToken)
    {
        var result = await _categoryService.GetCategoryTreeAsync(cancellationToken);
        return Ok(result);
    }
}

