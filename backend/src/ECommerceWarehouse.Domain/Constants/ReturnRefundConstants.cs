namespace ECommerceWarehouse.Domain.Constants;

public static class ReturnStatuses
{
    public const string Requested = "Requested";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string ItemsReceived = "ItemsReceived";
    public const string Inspected = "Inspected";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Requested, Approved, Rejected, ItemsReceived, Inspected, Completed, Cancelled
    };
}

public static class InspectionResults
{
    public const string Pending = "Pending";
    public const string Good = "Good";
    public const string MinorDefect = "MinorDefect";
    public const string Damaged = "Damaged";

    public static readonly IReadOnlySet<string> InspectableValues = new HashSet<string>(StringComparer.Ordinal)
    {
        Good, MinorDefect, Damaged
    };
}

public static class RefundStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Completed = "Completed";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Pending, Approved, Rejected, Completed
    };
}
