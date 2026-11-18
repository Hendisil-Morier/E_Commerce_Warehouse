import React from "react";
import { Construction, Info } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  screenCode?: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  screenCode,
  description,
}) => {
  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "8px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          {screenCode && (
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-forest-700)",
                backgroundColor: "var(--color-forest-50)",
                border: "1px solid var(--color-forest-200)",
                padding: "2px 10px",
                borderRadius: "999px",
                marginBottom: "6px",
              }}
            >
              Màn hình {screenCode}
            </span>
          )}
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-dark)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "999px",
            backgroundColor: "var(--color-peach-card)",
            border: "1px solid #fde68a",
            color: "#b45309",
            fontSize: "0.82rem",
            fontWeight: 600,
          }}
        >
          <Construction size={15} />
          <span>Đang xây dựng</span>
        </span>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px dashed var(--color-slate-300)",
          borderRadius: "16px",
          padding: "56px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "14px",
            backgroundColor: "var(--color-forest-50)",
            color: "var(--color-forest-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Construction size={28} />
        </div>

        <h2
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--color-dark)",
            marginBottom: "8px",
          }}
        >
          Đang xây dựng
        </h2>

        <p
          style={{
            color: "var(--color-muted)",
            fontSize: "0.92rem",
            maxWidth: "520px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          {description ||
            `Khung định tuyến và phân quyền cho màn hình "${title}" đã sẵn sàng. Nội dung chi tiết sẽ được triển khai ở các bước tiếp theo.`}
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "20px",
            padding: "8px 14px",
            borderRadius: "8px",
            backgroundColor: "var(--color-slate-50)",
            color: "var(--color-slate-600)",
            fontSize: "0.8rem",
          }}
        >
          <Info size={14} />
          <span>Giao diện khung chuẩn web desktop 1280px / 1440px</span>
        </div>
      </div>
    </section>
  );
};

