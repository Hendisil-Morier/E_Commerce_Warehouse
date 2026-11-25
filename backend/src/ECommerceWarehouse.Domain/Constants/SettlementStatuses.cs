namespace ECommerceWarehouse.Domain.Constants;

public static class SettlementStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Paid = "Paid";
    public const string Cancelled = "Cancelled";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Pending, Approved, Paid, Cancelled
    };
}
