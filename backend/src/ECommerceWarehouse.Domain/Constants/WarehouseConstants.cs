namespace ECommerceWarehouse.Domain.Constants;

public static class WarehouseTypes
{
    public const string Platform = "Platform";
    public const string Seller = "Seller";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Platform,
        Seller
    };
}

public static class StorageTypes
{
    public const string Standard = "Standard";
    public const string Cold = "Cold";
    public const string Hazardous = "Hazardous";
    public const string Fragile = "Fragile";
    public const string Inbound = "Inbound";
    public const string Returns = "Returns";
    public const string Damaged = "Damaged";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Standard,
        Cold,
        Hazardous,
        Fragile,
        Inbound,
        Returns,
        Damaged
    };

    /// <summary>
    /// Các khu vực bắt buộc IsSellable = false (Inbound, Returns, Damaged).
    /// </summary>
    public static readonly IReadOnlySet<string> NonSellableOnly = new HashSet<string>(StringComparer.Ordinal)
    {
        Inbound,
        Returns,
        Damaged
    };
}

public static class ReceiptTypes
{
    public const string SellerInbound = "SellerInbound";
    public const string TransferInbound = "TransferInbound";
    public const string CustomerReturn = "CustomerReturn";
    public const string Adjustment = "Adjustment";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        SellerInbound,
        TransferInbound,
        CustomerReturn,
        Adjustment
    };
}

public static class ReceiptStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Draft,
        Confirmed,
        Cancelled
    };
}

public static class StockMovementTypes
{
    public const string Receipt = "Receipt";
    public const string Issue = "Issue";
    public const string TransferIn = "TransferIn";
    public const string TransferOut = "TransferOut";
    public const string Adjustment = "Adjustment";
    public const string ReturnIn = "ReturnIn";
    public const string StockCount = "StockCount";
    public const string Reserve = "Reserve";
    public const string ReleaseReserve = "ReleaseReserve";
}

public static class StockReferenceTypes
{
    public const string Receipt = "Receipt";
    public const string Issue = "Issue";
    public const string Transfer = "Transfer";
    public const string StockCount = "StockCount";
    public const string Reservation = "Reservation";
    public const string ReturnRequest = "ReturnRequest";
    public const string Manual = "Manual";
}
