using ECommerceWarehouse.Domain.Constants;
using ECommerceWarehouse.Domain.Entities.Order;

namespace ECommerceWarehouse.Application.Services;

internal static class OrderStatusCalculator
{
    /// <summary>
    /// Tính lại trạng thái tổng hợp của đơn tổng (Orders) từ tập các đơn con (SellerOrders) và thanh toán.
    /// </summary>
    public static string ComputeAggregateOrderStatus(Order order)
    {
        if (order.OrderStatus == OrderStatuses.Expired)
        {
            return OrderStatuses.Expired;
        }

        if (order.SellerOrders.Count == 0)
        {
            return order.OrderStatus;
        }

        if (order.SellerOrders.All(so => so.Status == SellerOrderStatuses.Cancelled))
        {
            return OrderStatuses.Cancelled;
        }

        var active = order.SellerOrders
            .Where(so => so.Status != SellerOrderStatuses.Cancelled)
            .ToList();

        if (active.All(so => so.Status == SellerOrderStatuses.Delivered))
        {
            return OrderStatuses.Completed;
        }

        if (active.All(so => so.Status == SellerOrderStatuses.Shipped || so.Status == SellerOrderStatuses.Delivered))
        {
            return OrderStatuses.Shipped;
        }

        if (active.Any(so => so.Status == SellerOrderStatuses.Shipped || so.Status == SellerOrderStatuses.Delivered))
        {
            return OrderStatuses.PartiallyShipped;
        }

        if (active.Any(so =>
                so.Status == SellerOrderStatuses.Confirmed ||
                so.Status == SellerOrderStatuses.Preparing ||
                so.Status == SellerOrderStatuses.ReadyToShip))
        {
            return OrderStatuses.Processing;
        }

        var isPaidOrCod = order.Payments.Any(p =>
            p.PaymentStatus == PaymentStatuses.Paid || p.PaymentMethod == PaymentMethods.COD);

        return isPaidOrCod ? OrderStatuses.Confirmed : OrderStatuses.PendingPayment;
    }
}
