using ECommerceWarehouse.Domain.Entities.Warehouse;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerceWarehouse.Infrastructure.Data.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("Warehouses");
        builder.HasKey(x => x.WarehouseId);
        builder.Property(x => x.WarehouseName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.WarehouseType).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500).IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.OwnerSeller)
               .WithMany()
               .HasForeignKey(x => x.OwnerSellerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WarehouseLocationConfiguration : IEntityTypeConfiguration<WarehouseLocation>
{
    public void Configure(EntityTypeBuilder<WarehouseLocation> builder)
    {
        builder.ToTable("WarehouseLocations");
        builder.HasKey(x => x.LocationId);
        // Khóa thay thế kép (LocationId, WarehouseId) làm đích cho Composite FK của các bảng kho
        builder.HasAlternateKey(x => new { x.LocationId, x.WarehouseId });
        builder.HasIndex(x => new { x.WarehouseId, x.LocationCode }).IsUnique();
        builder.Property(x => x.LocationCode).HasMaxLength(50).IsRequired();
        builder.Property(x => x.StorageType).HasMaxLength(30).HasDefaultValue("Standard");

        builder.HasOne(x => x.Warehouse)
               .WithMany(w => w.Locations)
               .HasForeignKey(x => x.WarehouseId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.ToTable("Inventory");
        builder.HasKey(x => x.InventoryId);
        // Khóa thay thế kép (LocationId, VariantId) làm đích cho StockReservations
        builder.HasAlternateKey(x => new { x.LocationId, x.VariantId });
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.Property(x => x.RowVersion)
               .HasColumnType("timestamp(6)")
               .IsRowVersion()
               .ValueGeneratedOnAddOrUpdate();

        builder.HasOne(x => x.Location)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.WarehouseId })
               .HasPrincipalKey(l => new { l.LocationId, l.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Variant)
               .WithMany()
               .HasForeignKey(x => x.VariantId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockReservationConfiguration : IEntityTypeConfiguration<StockReservation>
{
    public void Configure(EntityTypeBuilder<StockReservation> builder)
    {
        builder.ToTable("StockReservations");
        builder.HasKey(x => x.ReservationId);
        builder.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("Active");
        builder.Property(x => x.ExpiresAt).HasColumnType("datetime(3)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ResolvedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.OrderItem)
               .WithMany()
               .HasForeignKey(x => x.OrderItemId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Location)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.WarehouseId })
               .HasPrincipalKey(l => new { l.LocationId, l.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Inventory)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.VariantId })
               .HasPrincipalKey(i => new { i.LocationId, i.VariantId })
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class InventoryReceiptConfiguration : IEntityTypeConfiguration<InventoryReceipt>
{
    public void Configure(EntityTypeBuilder<InventoryReceipt> builder)
    {
        builder.ToTable("InventoryReceipts");
        builder.HasKey(x => x.ReceiptId);
        builder.HasAlternateKey(x => new { x.ReceiptId, x.WarehouseId });
        builder.Property(x => x.ReceiptCode).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => x.ReceiptCode).IsUnique();
        builder.Property(x => x.ReceiptType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Draft");
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ConfirmedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.SenderSeller).WithMany().HasForeignKey(x => x.SenderSellerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Transfer).WithMany().HasForeignKey(x => x.TransferId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ReturnRequest).WithMany().HasForeignKey(x => x.ReturnRequestId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ConfirmedByUser).WithMany().HasForeignKey(x => x.ConfirmedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReceiptDetailConfiguration : IEntityTypeConfiguration<ReceiptDetail>
{
    public void Configure(EntityTypeBuilder<ReceiptDetail> builder)
    {
        builder.ToTable("ReceiptDetails");
        builder.HasKey(x => x.ReceiptDetailId);
        builder.Property(x => x.UnitCost).HasPrecision(18, 2);

        builder.HasOne(x => x.Receipt)
               .WithMany(r => r.Details)
               .HasForeignKey(x => new { x.ReceiptId, x.WarehouseId })
               .HasPrincipalKey(r => new { r.ReceiptId, r.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Location)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.WarehouseId })
               .HasPrincipalKey(l => new { l.LocationId, l.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class InventoryIssueConfiguration : IEntityTypeConfiguration<InventoryIssue>
{
    public void Configure(EntityTypeBuilder<InventoryIssue> builder)
    {
        builder.ToTable("InventoryIssues");
        builder.HasKey(x => x.IssueId);
        builder.HasAlternateKey(x => new { x.IssueId, x.WarehouseId });
        builder.Property(x => x.IssueCode).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => x.IssueCode).IsUnique();
        builder.Property(x => x.IssueType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Draft");
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ApprovedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.DispatchedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.SellerOrder).WithMany().HasForeignKey(x => x.SellerOrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Transfer).WithMany().HasForeignKey(x => x.TransferId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.DispatchedByUser).WithMany().HasForeignKey(x => x.DispatchedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class IssueDetailConfiguration : IEntityTypeConfiguration<IssueDetail>
{
    public void Configure(EntityTypeBuilder<IssueDetail> builder)
    {
        builder.ToTable("IssueDetails");
        builder.HasKey(x => x.IssueDetailId);

        builder.HasOne(x => x.Issue)
               .WithMany(i => i.Details)
               .HasForeignKey(x => new { x.IssueId, x.WarehouseId })
               .HasPrincipalKey(i => new { i.IssueId, i.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Location)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.WarehouseId })
               .HasPrincipalKey(l => new { l.LocationId, l.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Reservation).WithMany().HasForeignKey(x => x.ReservationId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockTransferConfiguration : IEntityTypeConfiguration<StockTransfer>
{
    public void Configure(EntityTypeBuilder<StockTransfer> builder)
    {
        builder.ToTable("StockTransfers");
        builder.HasKey(x => x.TransferId);
        builder.Property(x => x.TransferCode).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => x.TransferCode).IsUnique();
        builder.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Draft");
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ApprovedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ShippedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ReceivedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.SourceWarehouse).WithMany().HasForeignKey(x => x.SourceWarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.DestinationWarehouse).WithMany().HasForeignKey(x => x.DestinationWarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ReceivedByUser).WithMany().HasForeignKey(x => x.ReceivedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockTransferDetailConfiguration : IEntityTypeConfiguration<StockTransferDetail>
{
    public void Configure(EntityTypeBuilder<StockTransferDetail> builder)
    {
        builder.ToTable("StockTransferDetails");
        builder.HasKey(x => x.TransferDetailId);

        builder.HasOne(x => x.Transfer).WithMany(t => t.Details).HasForeignKey(x => x.TransferId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.SourceLocation).WithMany().HasForeignKey(x => x.SourceLocationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.DestinationLocation).WithMany().HasForeignKey(x => x.DestinationLocationId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockCountConfiguration : IEntityTypeConfiguration<StockCount>
{
    public void Configure(EntityTypeBuilder<StockCount> builder)
    {
        builder.ToTable("StockCounts");
        builder.HasKey(x => x.StockCountId);
        builder.HasAlternateKey(x => new { x.StockCountId, x.WarehouseId });
        builder.Property(x => x.CountCode).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => x.CountCode).IsUnique();
        builder.Property(x => x.Status).HasMaxLength(30).HasDefaultValue("Draft");
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.ApprovedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ApprovedByUser).WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockCountDetailConfiguration : IEntityTypeConfiguration<StockCountDetail>
{
    public void Configure(EntityTypeBuilder<StockCountDetail> builder)
    {
        builder.ToTable("StockCountDetails");
        builder.HasKey(x => x.StockCountDetailId);
        builder.HasIndex(x => new { x.StockCountId, x.LocationId, x.VariantId }).IsUnique();
        builder.Property(x => x.Difference)
               .HasComputedColumnSql("(`CountedQuantity` - `SystemQuantity`)", stored: true);
        builder.Property(x => x.Reason).HasMaxLength(500);

        builder.HasOne(x => x.StockCount)
               .WithMany(sc => sc.Details)
               .HasForeignKey(x => new { x.StockCountId, x.WarehouseId })
               .HasPrincipalKey(sc => new { sc.StockCountId, sc.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Location)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.WarehouseId })
               .HasPrincipalKey(l => new { l.LocationId, l.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("StockMovements");
        builder.HasKey(x => x.StockMovementId);
        builder.Property(x => x.MovementType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.ReferenceType).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Location)
               .WithMany()
               .HasForeignKey(x => new { x.LocationId, x.WarehouseId })
               .HasPrincipalKey(l => new { l.LocationId, l.WarehouseId })
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Variant).WithMany().HasForeignKey(x => x.VariantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class VariantAvailabilityViewConfiguration : IEntityTypeConfiguration<VariantAvailabilityView>
{
    public void Configure(EntityTypeBuilder<VariantAvailabilityView> builder)
    {
        builder.HasNoKey();
        builder.ToView("vw_VariantAvailability");
    }
}

public class StockReconciliationViewConfiguration : IEntityTypeConfiguration<StockReconciliationView>
{
    public void Configure(EntityTypeBuilder<StockReconciliationView> builder)
    {
        builder.HasNoKey();
        builder.ToView("vw_StockReconciliation");
    }
}