namespace ECommerceWarehouse.Domain.Exceptions;

/// <summary>
/// Exception ném ra khi tài nguyên không tồn tại hoặc không thuộc quyền sở hữu của người gọi (404).
/// </summary>
public class NotFoundException : BusinessException
{
    public NotFoundException(string message = "Không tìm thấy nội dung yêu cầu.")
        : base(ErrorCodes.NotFound, message, httpStatus: 404)
    {
    }

    public NotFoundException(string resourceName, object key)
        : base(ErrorCodes.NotFound, $"Không tìm thấy {resourceName} với mã '{key}'.", httpStatus: 404)
    {
    }
}

