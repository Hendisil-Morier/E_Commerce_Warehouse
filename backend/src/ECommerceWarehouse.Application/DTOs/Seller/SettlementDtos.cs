using ECommerceWarehouse.Application.DTOs.Common;
using FluentValidation;

namespace ECommerceWarehouse.Application.DTOs.Seller;

public class SettlementQueryDto : PaginationQuery
{
    public long? SellerId { get; set; }
    public string? Status { get; set; }
}

public class SettlementListItemDto
{
    public long SettlementId { get; set; }
    public long SellerId { get; set; }
    public string SellerBusinessName { get; set; } = null!;
    public string SettlementCode { get; set; } = null!;
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal RefundDeductionAmount { get; set; }
    public decimal CommissionRateSnapshot { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetPayoutAmount { get; set; }
    public string Status { get; set; } = null!;
    public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class SettlementDetailDto : SettlementListItemDto
{
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public long? ApprovedBy { get; set; }
    public List<SettlementItemDto> Items { get; set; } = [];
}

public class SettlementItemDto
{
    public long SettlementItemId { get; set; }
    public long SellerOrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public decimal GrossAmount { get; set; }
    public decimal RefundAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetAmount { get; set; }
}

public class GenerateSettlementRequestDto
{
    public long SellerId { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string? Note { get; set; }
}

public class MarkSettlementPaidRequestDto
{
    public string PaymentReference { get; set; } = null!;
    public string? Note { get; set; }
}

public class UpdateSellerCommissionRequestDto
{
    public decimal CommissionRate { get; set; }
}

public class SellerFinanceSummaryDto
{
    public decimal CommissionRate { get; set; }
    public decimal TotalDeliveredGross { get; set; }
    public decimal UnsettledGross { get; set; }
    public decimal UnsettledEstimatedCommission { get; set; }
    public decimal UnsettledEstimatedNet { get; set; }
    public decimal TotalSettledNet { get; set; }
    public decimal TotalPaidNet { get; set; }
    public int UnsettledOrderCount { get; set; }
}

public class GenerateSettlementRequestValidator : AbstractValidator<GenerateSettlementRequestDto>
{
    public GenerateSettlementRequestValidator()
    {
        RuleFor(x => x.SellerId).GreaterThan(0);
        RuleFor(x => x.PeriodEnd).GreaterThanOrEqualTo(x => x.PeriodStart)
            .WithMessage("Ngày kết thúc kỳ đối soát phải lớn hơn hoặc bằng ngày bắt đầu.");
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class MarkSettlementPaidRequestValidator : AbstractValidator<MarkSettlementPaidRequestDto>
{
    public MarkSettlementPaidRequestValidator()
    {
        RuleFor(x => x.PaymentReference)
            .NotEmpty().WithMessage("Mã giao dịch chi trả không được để trống.")
            .MaximumLength(100);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class UpdateSellerCommissionRequestValidator : AbstractValidator<UpdateSellerCommissionRequestDto>
{
    public UpdateSellerCommissionRequestValidator()
    {
        RuleFor(x => x.CommissionRate)
            .InclusiveBetween(0m, 100m)
            .WithMessage("Tỷ lệ hoa hồng phải nằm trong khoảng 0% đến 100%.");
    }
}
