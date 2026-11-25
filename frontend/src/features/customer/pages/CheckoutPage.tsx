import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Store,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/constants/routes";
import { useMyCart } from "@/features/cart/hooks/useCart";
import {
  useCreateAddress,
  useMyAddresses,
} from "@/features/customer/hooks/useAddresses";
import { useCheckoutMutation } from "@/features/customer/hooks/useOrders";
import { useToast } from "@/hooks/useToast";
import type { PaymentMethod } from "@/types/order";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  desc: string;
}> = [
  {
    value: "COD",
    label: "Thanh toán khi nhận hàng (COD)",
    desc: "Thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.",
  },
  {
    value: "BankTransfer",
    label: "Chuyển khoản ngân hàng",
    desc: "Chuyển khoản qua ngân hàng (đơn được giữ trong 15 phút để thanh toán).",
  },
  {
    value: "EWallet",
    label: "Ví điện tử",
    desc: "Thanh toán nhanh qua ví điện tử sau khi xác nhận đặt hàng.",
  },
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const selectedCartItemIds = (
    location.state as { cartItemIds?: number[] } | null
  )?.cartItemIds;

  const { data: cart, isLoading: cartLoading, isError: cartError, refetch } = useMyCart();
  const { data: addresses = [], isLoading: addrLoading } = useMyAddresses();
  const createAddress = useCreateAddress();
  const checkoutMutation = useCheckoutMutation();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idem-${Date.now()}`
  );

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const effectiveAddressId = useMemo(() => {
    if (selectedAddressId && addresses.some((a) => a.addressId === selectedAddressId)) {
      return selectedAddressId;
    }
    return (
      addresses.find((a) => a.isDefault)?.addressId ??
      addresses[0]?.addressId ??
      null
    );
  }, [addresses, selectedAddressId]);

  const checkoutShops = useMemo(() => {
    if (!cart) return [];
    const idSet =
      selectedCartItemIds && selectedCartItemIds.length > 0
        ? new Set(selectedCartItemIds)
        : null;
    return cart.shops
      .map((shop) => ({
        ...shop,
        items: shop.items.filter(
          (i) => i.isAvailable && (!idSet || idSet.has(i.cartItemId))
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [cart, selectedCartItemIds]);

  const totalAmount = useMemo(
    () =>
      checkoutShops.reduce(
        (sum, s) => sum + s.items.reduce((acc, i) => acc + i.lineTotal, 0),
        0
      ),
    [checkoutShops]
  );

  const totalQty = useMemo(
    () =>
      checkoutShops.reduce(
        (sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0),
        0
      ),
    [checkoutShops]
  );

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAddress.mutateAsync({
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        province: province.trim(),
        district: district.trim(),
        ward: ward.trim(),
        streetAddress: streetAddress.trim(),
        isDefault: addresses.length === 0,
      });
      setSelectedAddressId(created.addressId);
      setShowAddAddress(false);
      setRecipientName("");
      setPhoneNumber("");
      setProvince("");
      setDistrict("");
      setWard("");
      setStreetAddress("");
      toast.success("Đã thêm địa chỉ giao hàng.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePlaceOrder = async () => {
    if (!effectiveAddressId) {
      toast.error("Vui lòng chọn hoặc thêm địa chỉ nhận hàng.");
      return;
    }

    try {
      const created = await checkoutMutation.mutateAsync({
        payload: {
          addressId: effectiveAddressId,
          paymentMethod,
          note: note.trim() || null,
          cartItemIds:
            selectedCartItemIds && selectedCartItemIds.length > 0
              ? selectedCartItemIds
              : null,
        },
        idempotencyKey,
      });

      toast.success(`Đặt hàng thành công (${created.orderCode})!`);
      navigate(`/orders/${created.orderId}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (cartLoading || addrLoading) {
    return (
      <div className="ks-container ks-section">
        <div className="ew-card" style={{ padding: "24px" }}>
          <Skeleton lines={6} height={24} gap={14} />
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="ks-container ks-section">
        <ErrorState
          title="Không tải được thông tin đặt hàng"
          message="Vui lòng thử lại sau."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (checkoutShops.length === 0) {
    return (
      <div className="ks-container ks-section">
        <div className="ew-card" style={{ padding: "36px" }}>
          <EmptyState
            title="Không có sản phẩm khả dụng để đặt hàng"
            description="Vui lòng quay lại giỏ hàng để kiểm tra tồn kho hoặc chọn thêm sản phẩm."
            action={
              <Link to={ROUTES.CART}>
                <Button variant="primary">Quay lại giỏ hàng</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ks-container ks-section">
      <nav className="ks-breadcrumb" aria-label="Breadcrumb">
        <Link to={ROUTES.HOME}>Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to={ROUTES.CART}>Giỏ hàng</Link>
        <ChevronRight size={14} />
        <span>Thanh toán &amp; Đặt hàng</span>
      </nav>

      <div className="ew-page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="ew-page-header__title">Xác nhận đặt hàng</h1>
          <p className="ew-page-header__subtitle">
            Kiểm tra địa chỉ nhận hàng, sản phẩm và chọn phương thức thanh toán trước khi xác nhận.
          </p>
        </div>
      </div>

      <div className="ks-cart-grid">
        {/* Cột trái: Địa chỉ, Sản phẩm, Thanh toán */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* 1. Địa chỉ giao hàng */}
          <div className="ew-card" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                gap: "12px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <MapPin size={18} color="var(--color-primary)" />
                <span>Địa chỉ nhận hàng</span>
              </h2>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAddAddress(true)}
              >
                Thêm địa chỉ mới
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px dashed var(--color-border)",
                  color: "var(--color-muted)",
                  fontSize: "14px",
                }}
              >
                Bạn chưa có địa chỉ nhận hàng. Hãy bấm <strong>&quot;Thêm địa chỉ mới&quot;</strong> để tiếp tục.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {addresses.map((addr) => {
                  const active = addr.addressId === effectiveAddressId;
                  return (
                    <label
                      key={addr.addressId}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        border: active
                          ? "2px solid var(--color-primary)"
                          : "1px solid var(--color-border)",
                        background: active ? "#f0fdf4" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="addressId"
                        style={{ marginTop: "3px" }}
                        checked={active}
                        onChange={() => setSelectedAddressId(addr.addressId)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>
                          {addr.recipientName} • {addr.phoneNumber}
                          {addr.isDefault && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "11px",
                                color: "var(--color-primary)",
                                border: "1px solid var(--color-primary)",
                                borderRadius: "4px",
                                padding: "1px 6px",
                              }}
                            >
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "3px" }}>
                          {addr.fullAddress}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Danh sách sản phẩm tách theo Shop */}
          {checkoutShops.map((shop) => (
            <section key={shop.shopId} className="ks-cart-shop-card">
              <div className="ks-cart-shop-head">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px" }}>
                  <Store size={16} color="var(--color-primary)" />
                  <span>{shop.shopName}</span>
                </div>
                <span style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                  {shop.items.length} sản phẩm
                </span>
              </div>
              <div style={{ padding: "8px 20px" }}>
                {shop.items.map((item, idx) => (
                  <div
                    key={item.cartItemId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 0",
                      borderBottom:
                        idx < shop.items.length - 1
                          ? "1px solid var(--color-border)"
                          : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      {item.thumbnailUrl && (
                        <img
                          src={resolveAssetUrl(item.thumbnailUrl) ?? ""}
                          alt={item.productName}
                          style={{
                            width: "52px",
                            height: "52px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "14px", lineHeight: 1.4 }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "2px" }}>
                          {item.variantName} • SL: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                    <strong className="ks-tabular" style={{ fontSize: "15px", flexShrink: 0 }}>
                      {formatCurrency(item.lineTotal)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* 3. Phương thức thanh toán & Ghi chú */}
          <div className="ew-card" style={{ padding: "20px" }}>
            <h2
              style={{
                margin: "0 0 14px",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CreditCard size={18} color="var(--color-primary)" />
              <span>Phương thức thanh toán</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = paymentMethod === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: selected
                        ? "2px solid var(--color-primary)"
                        : "1px solid var(--color-border)",
                      background: selected ? "#f0fdf4" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      style={{ marginTop: "3px" }}
                      checked={selected}
                      onChange={() => setPaymentMethod(opt.value)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{opt.label}</div>
                      <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "2px" }}>
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <FormField label="Ghi chú cho người bán / giao hàng (tùy chọn)" htmlFor="checkout-note">
              <Textarea
                id="checkout-note"
                rows={2}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* Cột phải: Tóm tắt đơn hàng */}
        <aside>
          <div
            className="ks-summary-card"
            style={{
              background: "#ffffff",
              border: "2px solid var(--color-primary)",
              borderRadius: "14px",
              boxShadow: "0 10px 26px rgba(15, 118, 110, 0.10)",
              overflow: "hidden",
            }}
          >
            <div
              className="ks-summary-card__head"
              style={{
                background: "#f0fdf4",
                borderBottom: "1px solid #bbf7d0",
                padding: "16px 20px",
              }}
            >
              <h2 className="ks-summary-card__title" style={{ margin: 0, color: "var(--color-primary)" }}>
                Tổng kết đơn hàng
              </h2>
            </div>

            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div className="ks-summary-row ks-tabular">
                <span>Số kiện hàng theo shop</span>
                <strong>{checkoutShops.length} shop</strong>
              </div>
              <div className="ks-summary-row ks-tabular">
                <span>Tổng số lượng</span>
                <strong>{totalQty} sản phẩm</strong>
              </div>
              <div className="ks-summary-row ks-tabular">
                <span>Phí vận chuyển</span>
                <strong>Miễn phí</strong>
              </div>
              <div className="ks-summary-row ks-summary-total ks-tabular">
                <span>Tổng thanh toán</span>
                <span className="ks-summary-total-price">{formatCurrency(totalAmount)}</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={checkoutMutation.isPending}
                disabled={!effectiveAddressId || checkoutMutation.isPending}
                leftIcon={<CheckCircle2 size={18} />}
                onClick={() => void handlePlaceOrder()}
              >
                Xác nhận đặt hàng
              </Button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: "var(--color-muted)",
                }}
              >
                <ShieldCheck size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <span>Sản phẩm sẽ được giữ riêng cho đơn hàng của bạn ngay sau khi đặt.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal thêm nhanh địa chỉ */}
      <Modal
        open={showAddAddress}
        title="Thêm địa chỉ nhận hàng"
        onClose={() => setShowAddAddress(false)}
      >
        <form
          onSubmit={(e) => void handleAddAddress(e)}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <FormField label="Họ tên người nhận" required>
            <Input
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </FormField>
          <FormField label="Số điện thoại" required>
            <Input
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0987654321"
            />
          </FormField>
          <FormField label="Tỉnh / Thành phố" required>
            <Input
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Hà Nội"
            />
          </FormField>
          <FormField label="Quận / Huyện" required>
            <Input
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Cầu Giấy"
            />
          </FormField>
          <FormField label="Phường / Xã" required>
            <Input
              required
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="Dịch Vọng"
            />
          </FormField>
          <FormField label="Địa chỉ chi tiết" required>
            <Input
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Số 1 Xuân Thủy"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "6px" }}>
            <Button type="button" variant="secondary" onClick={() => setShowAddAddress(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={createAddress.isPending}>
              Lưu địa chỉ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
