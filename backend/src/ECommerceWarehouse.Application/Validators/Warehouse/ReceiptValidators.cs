using ECommerceWarehouse.Application.DTOs.Common;
using ECommerceWarehouse.Application.DTOs.Warehouse;
using ECommerceWarehouse.Domain.Constants;
using FluentValidation;

namespace ECommerceWarehouse.Application.Validators.Warehouse;

public class ReceiptQueryValidator : AbstractValidator<ReceiptQueryDto>
{
    public ReceiptQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, PaginationQuery.MaxPageSize);
        RuleFor(x => x.Status)
            .Must(s => string.IsNullOrWhiteSpace(s) || ReceiptStatuses.All.Contains(s))
            .WithMessage("Trạng thái phiếu nhập không hợp lệ.");
        RuleFor(x => x.ReceiptType)
            .Must(t => string.IsNullOrWhiteSpace(t) || ReceiptTypes.All.Contains(t))
            .WithMessage("Loại phiếu nhập không hợp lệ.");
    }
}

public class CreateReceiptRequestValidator : AbstractValidator<CreateReceiptRequestDto>
{
    public CreateReceiptRequestValidator()
    {
        RuleFor(x => x.WarehouseId).GreaterThan(0).WithMessage("Kho nhập không hợp lệ.");

        RuleFor(x => x.ReceiptType)
            .NotEmpty()
            .Must(t => ReceiptTypes.All.Contains(t))
            .WithMessage("Loại phiếu nhập chỉ được là SellerInbound, TransferInbound, CustomerReturn hoặc Adjustment.");

        RuleFor(x => x.SenderSellerId)
            .NotNull()
            .When(x => x.ReceiptType == ReceiptTypes.SellerInbound)
            .WithMessage("Phiếu nhập từ Seller (SellerInbound) bắt buộc phải có SenderSellerId.");

        RuleFor(x => x.SenderSellerId)
            .Null()
            .When(x => x.ReceiptType != ReceiptTypes.SellerInbound)
            .WithMessage("Chỉ phiếu SellerInbound mới được gán SenderSellerId.");

        RuleFor(x => x.Note).MaximumLength(500);

        RuleFor(x => x.Details)
            .NotNull()
            .Must(d => d != null && d.Count > 0)
            .WithMessage("Phiếu nhập phải có ít nhất 1 dòng chi tiết hàng hóa.");

        RuleForEach(x => x.Details).ChildRules(item =>
        {
            item.RuleFor(d => d.VariantId).GreaterThan(0).WithMessage("Biến thể sản phẩm không hợp lệ.");
            item.RuleFor(d => d.LocationId).GreaterThan(0).WithMessage("Vị trí kệ nhận không hợp lệ.");
            item.RuleFor(d => d.Quantity).GreaterThan(0).WithMessage("Số lượng nhập phải lớn hơn 0.");
            item.RuleFor(d => d.UnitCost)
                .GreaterThanOrEqualTo(0)
                .When(d => d.UnitCost.HasValue)
                .WithMessage("Giá vốn không được âm.");
        });
    }
}
