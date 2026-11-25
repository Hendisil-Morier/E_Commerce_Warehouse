namespace ECommerceWarehouse.Domain.Constants;

public static class IssueTypes
{
    public const string OrderFulfillment = "OrderFulfillment";
    public const string TransferOutbound = "TransferOutbound";
    public const string Adjustment = "Adjustment";
    public const string ReturnToSeller = "ReturnToSeller";
    public const string Disposal = "Disposal";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        OrderFulfillment, TransferOutbound, Adjustment, ReturnToSeller, Disposal
    };

    public static readonly IReadOnlySet<string> RequireApproval = new HashSet<string>(StringComparer.Ordinal)
    {
        Adjustment, ReturnToSeller, Disposal
    };
}

public static class IssueStatuses
{
    public const string Draft = "Draft";
    public const string Approved = "Approved";
    public const string Picking = "Picking";
    public const string Packed = "Packed";
    public const string Dispatched = "Dispatched";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Draft, Approved, Picking, Packed, Dispatched, Cancelled
    };
}

public static class ShippingStatuses
{
    public const string Preparing = "Preparing";
    public const string PickedUp = "PickedUp";
    public const string InTransit = "InTransit";
    public const string Delivered = "Delivered";
    public const string Failed = "Failed";
    public const string Returned = "Returned";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Preparing, PickedUp, InTransit, Delivered, Failed, Returned
    };
}
