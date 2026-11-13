using ECommerceWarehouse.Domain.Entities.Catalog;
using ECommerceWarehouse.Domain.Entities.Customer;
using ECommerceWarehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerceWarehouse.Infrastructure.Data.Configurations;

// ==================== CATALOG CONFIGURATIONS ====================

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(x => x.CategoryId);
        builder.Property(x => x.CategoryName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.HasIndex(x => new { x.ParentCategoryId, x.CategoryName }).IsUnique();

        builder.HasOne(x => x.ParentCategory)
               .WithMany(x => x.SubCategories)
               .HasForeignKey(x => x.ParentCategoryId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(x => x.ProductId);
        builder.Property(x => x.ProductName).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Description).HasColumnType("text");
        builder.Property(x => x.ProductStatus)
               .HasConversion<string>()
               .HasMaxLength(30)
               .HasDefaultValue(ProductStatus.Draft);
        builder.Property(x => x.RejectReason).HasMaxLength(500);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Shop)
               .WithMany()
               .HasForeignKey(x => x.ShopId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Category)
               .WithMany(c => c.Products)
               .HasForeignKey(x => x.CategoryId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("ProductVariants");
        builder.HasKey(x => x.VariantId);
        builder.Property(x => x.SKU).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => x.SKU).IsUnique();
        builder.Property(x => x.Barcode).HasMaxLength(50);
        builder.HasIndex(x => x.Barcode).IsUnique();
        builder.Property(x => x.VariantName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Price).HasPrecision(18, 2);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Product)
               .WithMany(p => p.Variants)
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");
        builder.HasKey(x => x.ImageId);
        builder.Property(x => x.ImageUrl).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.PrimaryFlag)
               .HasComputedColumnSql("IF(`IsPrimary`, 1, NULL)", stored: true);
        builder.HasIndex(x => new { x.ProductId, x.PrimaryFlag }).IsUnique();

        builder.HasOne(x => x.Product)
               .WithMany(p => p.Images)
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

// ==================== CUSTOMER CONFIGURATIONS ====================

public class UserAddressConfiguration : IEntityTypeConfiguration<UserAddress>
{
    public void Configure(EntityTypeBuilder<UserAddress> builder)
    {
        builder.ToTable("UserAddresses");
        builder.HasKey(x => x.AddressId);
        builder.Property(x => x.RecipientName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Province).HasMaxLength(100).IsRequired();
        builder.Property(x => x.District).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Ward).HasMaxLength(100).IsRequired();
        builder.Property(x => x.StreetAddress).HasMaxLength(300).IsRequired();
        builder.Property(x => x.DefaultFlag)
               .HasComputedColumnSql("IF(`IsDefault`, 1, NULL)", stored: true);
        builder.HasIndex(x => new { x.UserId, x.DefaultFlag }).IsUnique();
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.User)
               .WithMany()
               .HasForeignKey(x => x.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.ToTable("Carts");
        builder.HasKey(x => x.CartId);
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.User)
               .WithOne()
               .HasForeignKey<Cart>(x => x.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("CartItems");
        builder.HasKey(x => x.CartItemId);
        builder.HasIndex(x => new { x.CartId, x.VariantId }).IsUnique();
        builder.Property(x => x.AddedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Cart)
               .WithMany(c => c.Items)
               .HasForeignKey(x => x.CartId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Variant)
               .WithMany()
               .HasForeignKey(x => x.VariantId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WishlistConfiguration : IEntityTypeConfiguration<Wishlist>
{
    public void Configure(EntityTypeBuilder<Wishlist> builder)
    {
        builder.ToTable("Wishlists");
        builder.HasKey(x => x.WishlistId);
        builder.Property(x => x.WishlistName).HasMaxLength(100).HasDefaultValue("Yêu thích");
        builder.HasIndex(x => new { x.UserId, x.WishlistName }).IsUnique();
        builder.Property(x => x.CreatedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.User)
               .WithMany()
               .HasForeignKey(x => x.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("WishlistItems");
        builder.HasKey(x => x.WishlistItemId);
        builder.HasIndex(x => new { x.WishlistId, x.ProductId }).IsUnique();
        builder.Property(x => x.AddedAt).HasColumnType("datetime(3)");

        builder.HasOne(x => x.Wishlist)
               .WithMany(w => w.Items)
               .HasForeignKey(x => x.WishlistId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
               .WithMany()
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}