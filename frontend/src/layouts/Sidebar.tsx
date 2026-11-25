import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Warehouse,
} from "lucide-react";
import type { NavItem } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";

interface SidebarProps {
  areaLabel: string;
  areaBadge: string;
  menuItems: readonly NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  areaLabel,
  areaBadge,
  menuItems,
}) => {
  const user = useAuthStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = menuItems.filter((item) => hasRole(user, item.roles));

  return (
    <aside
      className={`ew-dashboard-sidebar ${collapsed ? "ew-dashboard-sidebar--collapsed" : ""}`}
      style={{
        width: collapsed ? "72px" : "256px",
        flexShrink: 0,
        backgroundColor: "#06382e",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        transition: "width 150ms ease",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? "18px 12px" : "18px 18px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: "8px",
          }}
        >
          <Link
            to={ROUTES.HOME}
            title="KHO SÀN+"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Warehouse size={19} strokeWidth={2.2} />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  KHO SÀN<span style={{ color: "#34d399" }}>+</span>
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--color-forest-300)",
                    fontWeight: 600,
                    marginTop: "2px",
                  }}
                >
                  {areaLabel}
                </div>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Thu gọn thanh điều hướng"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                color: "#e2e8f0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {collapsed ? (
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Mở rộng thanh điều hướng"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                color: "#e2e8f0",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: "12px",
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: "rgba(16, 185, 129, 0.16)",
              border: "1px solid rgba(52, 211, 153, 0.28)",
              color: "#6ee7b7",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {areaBadge}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        aria-label={`Menu ${areaLabel}`}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {visibleItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: "12px",
                minHeight: "44px",
                padding: collapsed ? "0" : "0 14px",
                borderRadius: "8px",
                fontSize: "0.88rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "#cbd5e1",
                backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
                textDecoration: "none",
              })}
            >
              <IconComponent size={18} strokeWidth={2} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Link back to Storefront */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Link
          to={ROUTES.HOME}
          title="Về sàn mua sắm"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            minHeight: "44px",
            padding: collapsed ? "0" : "0 14px",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            color: "#d1fae5",
            fontSize: "0.84rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {!collapsed && <span>Về sàn mua sắm</span>}
          <ExternalLink size={15} />
        </Link>
      </div>
    </aside>
  );
};
