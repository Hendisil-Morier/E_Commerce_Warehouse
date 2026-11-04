using ECommerceWarehouse.Domain.Entities.Order;
using ECommerceWarehouse.Domain.Entities.Review;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerceWarehouse.Infrastructure.Data.Configurations;

// ==================== ORDER & PAYMENT CONFIGURATIONS ====================

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(x => x.OrderId);
        builder.Property(x => x.OrderCode).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => x.OrderCode).IsUnique();
        builder.Property(x => x.RecipientName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.RecipientPhone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.ShippingProvince).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ShippingDistrict).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ShippingWard).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ShippingStreetAddress).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Subtotal).HasPrecision(18, 2);
        builder.Property(x => x.ShippingFee).HasPrecision(18, 2).HasDefaultValue(0m);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2).HasDefaultValue(0m);
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.OrderStatus).HasMaxLength(30).HasDefaultValue("PendingPayment");
        builder.Property(x => x.CancelReason).HasMaxLength(500);
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.ExpiresAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CancelledAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.Property(x => x.RowVersion)
               .HasColumnType("timestamp(6)")
               .IsRowVersion()
               .ValueGeneratedOnAddOrUpdate();

        builder.HasOne(x => x.Customer)
               .WithMany()
               .HasForeignKey(x => x.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SellerOrderConfiguration : IEntityTypeConfiguration<SellerOrder>
{
    public void Configure(EntityTypeBuilder<SellerOrder> builder)
    {
        builder.ToTable("SellerOrders");
        builder.HasKey(x => x.SellerOrderId);
        builder.HasIndex(x => new { x.OrderId, x.SellerId }).IsUnique();
        builder.Property(x => x.Subtotal).HasPrecision(18, 2);
        builder.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Pending");
        builder.Property(x => x.CancelReason).HasMaxLength(500);
        builder.Property(x => x.CancelledAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.Property(x => x.RowVersion)
               .HasColumnType("timestamp(6)")
               .IsRowVersion()
               .ValueGeneratedOnAddOrUpdate();

        builder.HasOne(x => x.Order)
               .WithMany(o => o.SellerOrders)
               .HasForeignKey(x => x.OrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Seller)
               .WithMany()
               .HasForeignKey(x => x.SellerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Warehouse)
               .WithMany()
               .HasForeignKey(x => x.WarehouseId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");
        builder.HasKey(x => x.OrderItemId);
        builder.HasIndex(x => new { x.SellerOrderId, x.VariantId }).IsUnique();
        builder.Property(x => x.ProductNameSnapshot).HasMaxLength(250).IsRequired();
        builder.Property(x => x.SKUSnapshot).HasMaxLength(80).IsRequired();
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.LineTotal)
               .HasPrecision(18, 2)
               .HasComputedColumnSql("(`UnitPrice` * `Quantity`)", stored: true);

        builder.HasOne(x => x.SellerOrder)
               .WithMany(so => so.Items)
               .HasForeignKey(x => x.SellerOrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Variant)
               .WithMany()
               .HasForeignKey(x => x.VariantId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.ToTable("OrderStatusHistory");
        builder.HasKey(x => x.HistoryId);
        builder.Property(x => x.FromStatus).HasMaxLength(30);
        builder.Property(x => x.ToStatus).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Order)
               .WithMany(o => o.StatusHistories)
               .HasForeignKey(x => x.OrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SellerOrder)
               .WithMany()
               .HasForeignKey(x => x.SellerOrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ChangedByUser)
               .WithMany()
               .HasForeignKey(x => x.ChangedBy)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(x => x.PaymentId);
        builder.Property(x => x.PaymentMethod).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.PaymentStatus).HasMaxLength(30).HasDefaultValue("Pending");
        builder.Property(x => x.TransactionCode).HasMaxLength(100);
        builder.HasIndex(x => new { x.PaymentMethod, x.TransactionCode }).IsUnique();
        builder.Property(x => x.PaidAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Order)
               .WithMany(o => o.Payments)
               .HasForeignKey(x => x.OrderId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.ToTable("Refunds");
        builder.HasKey(x => x.RefundId);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Reason).HasMaxLength(500);
        builder.Property(x => x.RefundStatus).HasMaxLength(30).HasDefaultValue("Pending");
        builder.Property(x => x.ProcessedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Payment)
               .WithMany(p => p.Refunds)
               .HasForeignKey(x => x.PaymentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SellerOrder)
               .WithMany()
               .HasForeignKey(x => x.SellerOrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ReturnRequest)
               .WithMany()
               .HasForeignKey(x => x.ReturnRequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ApprovedByUser)
               .WithMany()
               .HasForeignKey(x => x.ApprovedBy)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

// ==================== SHIPPING, RETURNS & REVIEWS CONFIGURATIONS ====================

public class CarrierConfiguration : IEntityTypeConfiguration<Carrier>
{
    public void Configure(EntityTypeBuilder<Carrier> builder)
    {
        builder.ToTable("Carriers");
        builder.HasKey(x => x.CarrierId);
        builder.Property(x => x.CarrierCode).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.CarrierCode).IsUnique();
        builder.Property(x => x.CarrierName).HasMaxLength(100).IsRequired();
    }
}

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments");
        builder.HasKey(x => x.ShipmentId);
        builder.Property(x => x.TrackingNumber).HasMaxLength(100);
        builder.HasIndex(x => new { x.CarrierId, x.TrackingNumber }).IsUnique();
        builder.Property(x => x.ShippingStatus).HasMaxLength(30).HasDefaultValue("Preparing");
        builder.Property(x => x.CodAmount).HasPrecision(18, 2).HasDefaultValue(0m);
        builder.Property(x => x.FailedReason).HasMaxLength(500);
        builder.Property(x => x.ShippedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.DeliveredAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.SellerOrder)
               .WithMany(so => so.Shipments)
               .HasForeignKey(x => x.SellerOrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Carrier)
               .WithMany(c => c.Shipments)
               .HasForeignKey(x => x.CarrierId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReturnRequestConfiguration : IEntityTypeConfiguration<ReturnRequest>
{
    public void Configure(EntityTypeBuilder<ReturnRequest> builder)
    {
        builder.ToTable("ReturnRequests");
        builder.HasKey(x => x.ReturnRequestId);
        builder.Property(x => x.RequestCode).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => x.RequestCode).IsUnique();
        builder.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Requested");
        builder.Property(x => x.RejectReason).HasMaxLength(500);
        builder.Property(x => x.ReviewedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.SellerOrder)
               .WithMany(so => so.ReturnRequests)
               .HasForeignKey(x => x.SellerOrderId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Customer)
               .WithMany()
               .HasForeignKey(x => x.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ReviewedByUser)
               .WithMany()
               .HasForeignKey(x => x.ReviewedBy)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReturnRequestItemConfiguration : IEntityTypeConfiguration<ReturnRequestItem>
{
    public void Configure(EntityTypeBuilder<ReturnRequestItem> builder)
    {
        builder.ToTable("ReturnRequestItems");
        builder.HasKey(x => x.ReturnItemId);
        builder.HasIndex(x => new { x.ReturnRequestId, x.OrderItemId }).IsUnique();
        builder.Property(x => x.InspectionResult).HasMaxLength(20).HasDefaultValue("Pending");
        builder.Property(x => x.InspectionNote).HasMaxLength(500);
        builder.Property(x => x.InspectedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.ReturnRequest)
               .WithMany(rr => rr.Items)
               .HasForeignKey(x => x.ReturnRequestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OrderItem)
               .WithMany()
               .HasForeignKey(x => x.OrderItemId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.InspectedByUser)
               .WithMany()
               .HasForeignKey(x => x.InspectedBy)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.RestockLocation)
               .WithMany()
               .HasForeignKey(x => x.RestockLocationId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");
        builder.HasKey(x => x.ReviewId);
        builder.HasIndex(x => new { x.CustomerId, x.OrderItemId }).IsUnique();
        builder.Property(x => x.Rating).HasColumnType("tinyint");
        builder.Property(x => x.Comment).HasMaxLength(2000);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Customer)
               .WithMany()
               .HasForeignKey(x => x.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.OrderItem)
               .WithMany()
               .HasForeignKey(x => x.OrderItemId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}