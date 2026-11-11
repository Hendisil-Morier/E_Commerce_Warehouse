using ECommerceWarehouse.Application.DTOs.Seller;
using ECommerceWarehouse.Domain.Entities.Identity;
using DomainSeller = ECommerceWarehouse.Domain.Entities.Seller.Seller;

namespace ECommerceWarehouse.Application.Mappings;

public static class SellerMapping
{
    public static SellerDto ToDto(this DomainSeller seller, User? userOverride = null)
    {
        var user = userOverride ?? seller.User;

        return new SellerDto
        {
            SellerId = seller.SellerId,
            UserId = seller.UserId,
            BusinessName = seller.BusinessName,
            TaxCode = seller.TaxCode,
            Description = seller.Description,
            CommissionRate = seller.CommissionRate,
            Status = seller.Status.ToString(),
            ApprovedAt = seller.ApprovedAt,
            RejectReason = seller.RejectReason,
            CreatedAt = seller.CreatedAt,
            UpdatedAt = seller.UpdatedAt,
            User = user == null
                ? null
                : new SellerUserSummaryDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    FullName = user.FullName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber
                }
        };
    }
}

