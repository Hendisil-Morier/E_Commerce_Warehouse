using Microsoft.AspNetCore.Mvc;

namespace ECommerceWarehouse.WebAPI.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            message = "ECommerceWarehouse API is running"
        });
    }
}
