import React from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <header className="ew-page-header">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h1 className="ew-page-header__title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="ew-page-header__subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="ew-page-header__actions">{actions}</div>}
    </header>
  );
};

