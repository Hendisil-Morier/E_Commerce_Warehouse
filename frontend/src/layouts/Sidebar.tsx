import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ExternalLink, Package } from "lucide-react";
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
  const visibleItems = menuItems.filter((item) => hasRole(user, item.roles));

  return (
    <aside
      style={{
        width: "252px",
        flexShrink: 0,
        backgroundColor: "#072b22",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: "20px 20px 18px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Link
          to={ROUTES.HOME}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "var(--color-forest-600)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            <Package size={20} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
              }}
            >
              E-Warehouse
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-forest-300)",
                fontWeight: 600,
                marginTop: "2px",
              }}
            >
              {areaLabel}
            </div>
          </div>
        </Link>

        <div
          style={{
            marginTop: "12px",
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "rgba(16, 185, 129, 0.16)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            color: "#6ee7b7",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {areaBadge}
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        aria-label={`Menu ${areaLabel}`}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
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
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minHeight: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#ffffff" : "#cbd5e1",
                backgroundColor: isActive
                  ? "var(--color-forest-600)"
                  : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
                textDecoration: "none",
              })}
            >
              <IconComponent size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Link back to Storefront */}
      <div
        style={{
          padding: "14px 12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Link
          to={ROUTES.HOME}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "44px",
            padding: "0 14px",
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            color: "#d1fae5",
            fontSize: "0.85rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <span>Về sàn mua sắm</span>
          <ExternalLink size={15} />
        </Link>
      </div>
    </aside>
  );
};

