import React, { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  useCreateVariantMutation,
  useUpdateVariantMutation,
} from "@/features/seller/hooks/useSellerCatalog";
import type { ProductVariantDto, UpsertVariantRequest } from "@/types/catalog";

const EMPTY_VARIANT_DRAFT: UpsertVariantRequest = {
  sku: "",
  barcode: "",
  variantName: "",
  price: 0,
  weightGrams: null,
  isActive: true,
};

function validateVariantFields(v: UpsertVariantRequest): string | null {
  if (!v.sku.trim()) return "Vui lòng nhập SKU.";
  if (v.sku.trim().length > 80) return "SKU tối đa 80 ký tự.";
  if (!v.variantName.trim()) return "Vui lòng nhập tên biến thể.";
  if (v.variantName.trim().length > 150) return "Tên biến thể tối đa 150 ký tự.";
  if (!Number.isFinite(v.price) || v.price <= 0) return "Giá bán phải lớn hơn 0.";
  if (v.weightGrams !== null && v.weightGrams !== undefined && v.weightGrams < 0) {
    return "Khối lượng không được âm.";
  }
  return null;
}

function toPayload(v: UpsertVariantRequest): UpsertVariantRequest {
  return {
    sku: v.sku.trim(),
    barcode: v.barcode?.trim() || null,
    variantName: v.variantName.trim(),
    price: Number(v.price),
    weightGrams:
      v.weightGrams === null || v.weightGrams === undefined || Number.isNaN(v.weightGrams)
        ? null
        : Math.trunc(Number(v.weightGrams)),
    isActive: v.isActive,
  };
}

interface VariantFieldsGridProps {
  value: UpsertVariantRequest;
  disabled: boolean;
  onChange: (next: UpsertVariantRequest) => void;
  footerActions: React.ReactNode;
}

const VariantFieldsGrid: React.FC<VariantFieldsGridProps> = ({
  value,
  disabled,
  onChange,
  footerActions,
}) => (
  <div className="ew-variant-row__grid">
    <div>
      <label className="ew-variant-label">SKU *</label>
      <Input
        value={value.sku}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, sku: e.target.value })}
        placeholder="SKU-001"
      />
    </div>
    <div>
      <label className="ew-variant-label">Tên biến thể *</label>
      <Input
        value={value.variantName}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, variantName: e.target.value })}
        placeholder="Đen - 128GB"
      />
    </div>
    <div>
      <label className="ew-variant-label">Giá bán (₫) *</label>
      <Input
        type="number"
        min={1}
        step={1000}
        value={value.price || ""}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
        placeholder="250000"
      />
    </div>
    <div>
      <label className="ew-variant-label">Barcode</label>
      <Input
        value={value.barcode ?? ""}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, barcode: e.target.value })}
        placeholder="Tùy chọn"
      />
    </div>
    <div>
      <label className="ew-variant-label">Khối lượng (g)</label>
      <Input
        type="number"
        min={0}
        value={value.weightGrams ?? ""}
        disabled={disabled}
        onChange={(e) =>
          onChange({
            ...value,
            weightGrams: e.target.value === "" ? null : Number(e.target.value),
          })
        }
        placeholder="Ví dụ: 350"
      />
    </div>
    <div className="ew-variant-row__footer">
      <label className="ew-inline-check">
        <input
          type="checkbox"
          checked={value.isActive}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, isActive: e.target.checked })}
        />
        <span>Đang bán</span>
      </label>
      {footerActions}
    </div>
  </div>
);

const ExistingVariantRow: React.FC<{
  variant: ProductVariantDto;
  disabled: boolean;
  isSaving: boolean;
  onSave: (variantId: number, payload: UpsertVariantRequest) => Promise<void>;
}> = ({ variant, disabled, isSaving, onSave }) => {
  const [form, setForm] = useState<UpsertVariantRequest>({
    sku: variant.sku,
    barcode: variant.barcode ?? "",
    variantName: variant.variantName,
    price: variant.price,
    weightGrams: variant.weightGrams,
    isActive: variant.isActive,
  });
  const [rowError, setRowError] = useState<string | null>(null);

  const isDirty =
    form.sku.trim() !== variant.sku ||
    (form.barcode?.trim() || "") !== (variant.barcode ?? "") ||
    form.variantName.trim() !== variant.variantName ||
    Number(form.price) !== variant.price ||
    (form.weightGrams ?? null) !== variant.weightGrams ||
    form.isActive !== variant.isActive;

  const handleSave = async () => {
    const err = validateVariantFields(form);
    if (err) {
      setRowError(err);
      return;
    }
    setRowError(null);
    await onSave(variant.variantId, toPayload(form));
  };

  return (
    <div className="ew-variant-row">
      <VariantFieldsGrid
        value={form}
        disabled={disabled || isSaving}
        onChange={setForm}
        footerActions={
          <>
            <StatusBadge status={form.isActive ? "Active" : "Inactive"} />
            <Button
              size="sm"
              variant={isDirty ? "primary" : "secondary"}
              leftIcon={<Save size={14} />}
              loading={isSaving}
              disabled={disabled || !isDirty}
              onClick={() => void handleSave()}
            >
              Lưu biến thể
            </Button>
          </>
        }
      />
      {rowError && (
        <div className="ew-field__error" role="alert" style={{ marginTop: "6px" }}>
          {rowError}
        </div>
      )}
    </div>
  );
};

export type ProductVariantsEditorProps =
  | {
      mode: "create";
      draftVariants: UpsertVariantRequest[];
      onDraftChange: (next: UpsertVariantRequest[]) => void;
      disabled?: boolean;
    }
  | {
      mode: "edit";
      productId: number;
      variants: ProductVariantDto[];
      disabled?: boolean;
    };

export const ProductVariantsEditor: React.FC<ProductVariantsEditorProps> = (props) => {
  if (props.mode === "create") {
    return (
      <CreateModeVariantsEditor
        draftVariants={props.draftVariants}
        onDraftChange={props.onDraftChange}
        disabled={props.disabled ?? false}
      />
    );
  }

  return (
    <EditModeVariantsEditor
      productId={props.productId}
      variants={props.variants}
      disabled={props.disabled ?? false}
    />
  );
};

const CreateModeVariantsEditor: React.FC<{
  draftVariants: UpsertVariantRequest[];
  onDraftChange: (next: UpsertVariantRequest[]) => void;
  disabled: boolean;
}> = ({ draftVariants, onDraftChange, disabled }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    {draftVariants.length === 0 ? (
      <div className="ew-image-empty">
        Chưa có biến thể nào. Bạn có thể thêm biến thể ngay bây giờ hoặc lưu nháp rồi thêm sau.
      </div>
    ) : (
      draftVariants.map((row, index) => (
        <div key={index} className="ew-variant-row">
          <VariantFieldsGrid
            value={row}
            disabled={disabled}
            onChange={(next) =>
              onDraftChange(draftVariants.map((item, idx) => (idx === index ? next : item)))
            }
            footerActions={
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Trash2 size={14} />}
                disabled={disabled}
                onClick={() => onDraftChange(draftVariants.filter((_, idx) => idx !== index))}
                style={{ color: "var(--color-danger)" }}
              >
                Xóa dòng
              </Button>
            }
          />
        </div>
      ))
    )}
    <div>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Plus size={15} />}
        disabled={disabled}
        onClick={() => onDraftChange([...draftVariants, { ...EMPTY_VARIANT_DRAFT }])}
      >
        Thêm dòng biến thể
      </Button>
    </div>
  </div>
);

const EditModeVariantsEditor: React.FC<{
  productId: number;
  variants: ProductVariantDto[];
  disabled: boolean;
}> = ({ productId, variants, disabled }) => {
  const createVariant = useCreateVariantMutation(productId);
  const updateVariant = useUpdateVariantMutation(productId);

  const [newVariant, setNewVariant] = useState<UpsertVariantRequest | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);

  const handleSaveExisting = async (variantId: number, payload: UpsertVariantRequest) => {
    setSavingVariantId(variantId);
    try {
      await updateVariant.mutateAsync({ variantId, payload });
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleCreateNew = async () => {
    if (!newVariant) return;
    const err = validateVariantFields(newVariant);
    if (err) {
      setNewError(err);
      return;
    }
    setNewError(null);
    try {
      await createVariant.mutateAsync(toPayload(newVariant));
      setNewVariant(null);
    } catch {
      // Toast xử lý lỗi từ server
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {variants.length === 0 && !newVariant && (
        <div className="ew-image-empty">
          Sản phẩm chưa có biến thể nào. Cần ít nhất 1 biến thể đang bán trước khi gửi duyệt.
        </div>
      )}

      {variants.map((variant) => (
        <ExistingVariantRow
          key={`${variant.variantId}-${variant.updatedAt}`}
          variant={variant}
          disabled={disabled}
          isSaving={savingVariantId === variant.variantId}
          onSave={handleSaveExisting}
        />
      ))}

      {newVariant ? (
        <div className="ew-variant-row ew-variant-row--new">
          <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "8px" }}>
            Biến thể mới
          </div>
          <VariantFieldsGrid
            value={newVariant}
            disabled={disabled || createVariant.isPending}
            onChange={setNewVariant}
            footerActions={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={createVariant.isPending}
                  onClick={() => {
                    setNewVariant(null);
                    setNewError(null);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  loading={createVariant.isPending}
                  disabled={disabled}
                  onClick={() => void handleCreateNew()}
                >
                  Thêm biến thể
                </Button>
              </>
            }
          />
          {newError && (
            <div className="ew-field__error" role="alert" style={{ marginTop: "6px" }}>
              {newError}
            </div>
          )}
        </div>
      ) : (
        <div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus size={15} />}
            disabled={disabled}
            onClick={() => {
              setNewError(null);
              setNewVariant({ ...EMPTY_VARIANT_DRAFT });
            }}
          >
            Thêm biến thể mới
          </Button>
        </div>
      )}
    </div>
  );
};
