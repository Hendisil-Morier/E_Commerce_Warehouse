using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Domain.Enums;

namespace ECommerceWarehouse.Application.DTOs.Seller;

public class SellerListQueryDto : PaginationQuery
{
    public SellerStatus? Status { get; set; }
    public string? Search { get; set; }
}

