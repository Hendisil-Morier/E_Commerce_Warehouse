namespace ECommerceWarehouse.Domain.Constants;

public static class OrderStatuses
{
    public const string PendingPayment = "PendingPayment";
    public const string Confirmed = "Confirmed";
    public const string Processing = "Processing";
    public const string PartiallyShipped = "PartiallyShipped";
    public const string Shipped = "Shipped";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string Expired = "Expired";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        PendingPayment, Confirmed, Processing, PartiallyShipped, Shipped, Completed, Cancelled, Expired
    };
}

public static class SellerOrderStatuses
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Preparing = "Preparing";
    public const string ReadyToShip = "ReadyToShip";
    public const string Shipped = "Shipped";
    public const string Delivered = "Delivered";
    public const string DeliveryFailed = "DeliveryFailed";
    public const string Cancelled = "Cancelled";
    public const string Returned = "Returned";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Pending, Confirmed, Preparing, ReadyToShip, Shipped, Delivered, DeliveryFailed, Cancelled, Returned
    };

    /// <summary>
    /// Các trạng thái đã bàn giao vận chuyển trở đi (không cho phép hủy tự do).
    /// </summary>
    public static readonly IReadOnlySet<string> NonCancellable = new HashSet<string>(StringComparer.Ordinal)
    {
        Shipped, Delivered, DeliveryFailed, Cancelled, Returned
    };
}

public static class PaymentMethods
{
    public const string COD = "COD";
    public const string BankTransfer = "BankTransfer";
    public const string EWallet = "EWallet";
    public const string CreditCard = "CreditCard";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        COD, BankTransfer, EWallet, CreditCard
    };
}

public static class PaymentStatuses
{
    public const string Pending = "Pending";
    public const string Paid = "Paid";
    public const string Failed = "Failed";
    public const string Refunded = "Refunded";
    public const string PartiallyRefunded = "PartiallyRefunded";
}

public static class ReservationStatuses
{
    public const string Active = "Active";
    public const string Consumed = "Consumed";
    public const string Released = "Released";
    public const string Expired = "Expired";
}
