import React, { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRegisterSellerMutation } from "@/features/seller/hooks/useSellerRegistration";
import { getErrorMessage, getFieldErrors } from "@/utils/errorHandler";

export interface SellerRegisterFormProps {
  initialValues?: {
    businessName: string;
    taxCode: string | null;
    description: string | null;
  };
  isResubmit?: boolean;
  onCancel?: () => void;
  onSubmitted?: () => void;
}

export const SellerRegisterForm: React.FC<SellerRegisterFormProps> = ({
  initialValues,
  isResubmit = false,
  onCancel,
  onSubmitted,
}) => {
  const businessNameId = useId();
  const taxCodeId = useId();
  const descriptionId = useId();

  const [values, setValues] = useState({
    businessName: initialValues?.businessName ?? "",
    taxCode: initialValues?.taxCode ?? "",
    description: initialValues?.description ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const registerMutation = useRegisterSellerMutation();

  const validateClient = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const trimmedName = values.businessName.trim();
    if (!trimmedName) {
      errors.businessName = "Vui lòng nhập tên doanh nghiệp hoặc hộ kinh doanh.";
    } else if (trimmedName.length > 200) {
      errors.businessName = "Tên doanh nghiệp không được vượt quá 200 ký tự.";
    }
    if (values.taxCode.trim().length > 20) {
      errors.taxCode = "Mã số thuế không được vượt quá 20 ký tự.";
    }
    if (values.description.trim().length > 1000) {
      errors.description = "Mô tả không được vượt quá 1000 ký tự.";
    }
    return errors;
  };

  const handleFieldChange = (field: keyof typeof values, nextValue: string) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formError) setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    try {
      await registerMutation.mutateAsync({
        businessName: values.businessName.trim(),
        taxCode: values.taxCode.trim() || undefined,
        description: values.description.trim() || undefined,
      });
      onSubmitted?.();
    } catch (error: unknown) {
      const serverErrors = getFieldErrors(error);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      } else {
        setFormError(getErrorMessage(error));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ew-card ew-seller-card" noValidate>
      <div className="ew-seller-card__header">
        <div>
          <h2 className="ew-seller-card__title">
            {isResubmit ? "Cập nhật và gửi lại hồ sơ người bán" : "Thông tin đăng ký người bán"}
          </h2>
          <p className="ew-seller-card__subtitle">
            {isResubmit
              ? "Điều chỉnh lại thông tin theo lý do từ chối để gửi Admin xét duyệt lại."
              : "Điền thông tin doanh nghiệp hoặc hộ kinh doanh để mở gian hàng trên sàn."}
          </p>
        </div>
      </div>

      {formError && (
        <div className="ew-banner ew-banner--danger" role="alert">
          {formError}
        </div>
      )}

      <div className="ew-seller-form__fields">
        <FormField
          label="Tên doanh nghiệp / Hộ kinh doanh"
          htmlFor={businessNameId}
          required
          error={fieldErrors.businessName}
          hint="Tối đa 200 ký tự. Đây là tên pháp lý của tài khoản người bán."
        >
          <Input
            id={businessNameId}
            value={values.businessName}
            maxLength={200}
            disabled={registerMutation.isPending}
            hasError={Boolean(fieldErrors.businessName)}
            placeholder="Ví dụ: Công ty TNHH Gia Dụng Minh Anh"
            onChange={(e) => handleFieldChange("businessName", e.target.value)}
          />
        </FormField>

        <FormField
          label="Mã số thuế"
          htmlFor={taxCodeId}
          error={fieldErrors.taxCode}
          hint="Không bắt buộc. Tối đa 20 ký tự nếu có."
        >
          <Input
            id={taxCodeId}
            value={values.taxCode}
            maxLength={20}
            disabled={registerMutation.isPending}
            hasError={Boolean(fieldErrors.taxCode)}
            placeholder="Ví dụ: 0109988776"
            onChange={(e) => handleFieldChange("taxCode", e.target.value)}
          />
        </FormField>

        <FormField
          label="Mô tả ngành hàng & giới thiệu"
          htmlFor={descriptionId}
          error={fieldErrors.description}
          hint="Không bắt buộc. Tối đa 1000 ký tự giới thiệu mặt hàng dự kiến kinh doanh."
        >
          <Textarea
            id={descriptionId}
            rows={4}
            value={values.description}
            maxLength={1000}
            disabled={registerMutation.isPending}
            hasError={Boolean(fieldErrors.description)}
            placeholder="Mô tả nhóm sản phẩm, nguồn hàng hoặc năng lực cung ứng của bạn..."
            onChange={(e) => handleFieldChange("description", e.target.value)}
          />
        </FormField>
      </div>

      <div className="ew-seller-card__actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            disabled={registerMutation.isPending}
            onClick={onCancel}
          >
            Hủy chỉnh sửa
          </Button>
        )}
        <Button type="submit" loading={registerMutation.isPending}>
          {isResubmit ? "Gửi lại hồ sơ xét duyệt" : "Gửi hồ sơ đăng ký"}
        </Button>
      </div>
    </form>
  );
};
