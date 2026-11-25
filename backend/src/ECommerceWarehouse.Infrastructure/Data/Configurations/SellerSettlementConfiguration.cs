using ECommerceWarehouse.Domain.Entities.Seller;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerceWarehouse.Infrastructure.Data.Configurations;

public class SellerSettlementConfiguration : IEntityTypeConfiguration<SellerSettlement>
{
    public void Configure(EntityTypeBuilder<SellerSettlement> builder)
    {
        builder.ToTable("SellerSettlements");
        builder.HasKey(x => x.SettlementId);

        builder.Property(x => x.SettlementCode).HasMaxLength(40).IsRequired();
        builder.Property(x => x.GrossAmount).HasPrecision(18, 2);
        builder.Property(x => x.RefundDeductionAmount).HasPrecision(18, 2);
        builder.Property(x => x.CommissionRateSnapshot).HasPrecision(5, 2);
        builder.Property(x => x.CommissionAmount).HasPrecision(18, 2);
        builder.Property(x => x.NetPayoutAmount).HasPrecision(18, 2);
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.PaymentReference).HasMaxLength(100);
        builder.Property(x => x.Note).HasMaxLength(500);

        builder.HasIndex(x => x.SettlementCode).IsUnique();

        builder.HasOne(x => x.Seller)
            .WithMany()
            .HasForeignKey(x => x.SellerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CreatedByUser)
            .WithMany()
            .HasForeignKey(x => x.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ApprovedByUser)
            .WithMany()
            .HasForeignKey(x => x.ApprovedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class SellerSettlementItemConfiguration : IEntityTypeConfiguration<SellerSettlementItem>
{
    public void Configure(EntityTypeBuilder<SellerSettlementItem> builder)
    {
        builder.ToTable("SellerSettlementItems");
        builder.HasKey(x => x.SettlementItemId);

        builder.Property(x => x.GrossAmount).HasPrecision(18, 2);
        builder.Property(x => x.RefundAmount).HasPrecision(18, 2);
        builder.Property(x => x.CommissionAmount).HasPrecision(18, 2);
        builder.Property(x => x.NetAmount).HasPrecision(18, 2);

        builder.HasIndex(x => x.SellerOrderId).IsUnique();

        builder.HasOne(x => x.Settlement)
            .WithMany(s => s.Items)
            .HasForeignKey(x => x.SettlementId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.SellerOrder)
            .WithMany()
            .HasForeignKey(x => x.SellerOrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
