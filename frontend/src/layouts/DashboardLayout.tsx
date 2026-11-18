import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowRightLeft, LogOut, User as UserIcon } from "lucide-react";
import type { NavItem } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { Sidebar } from "@/layouts/Sidebar";
import { useAuthStore } from "@/stores/authStore";
import {
  ROLE_LABELS,
  getAvailableWorkspaces,
  getPrimaryRole,
} from "@/utils/roleUtils";

interface DashboardLayoutProps {
  areaLabel: string;
  areaBadge: string;
  menuItems: readonly NavItem[];
  basePath: string;
}

function resolvePageTitle(
  pathname: string,
  menuItems: readonly NavItem[],
  fallback: string
): string {
  const exactMatch = menuItems.find((item) => item.path === pathname);
  if (exactMatch) return exactMatch.label;

  const prefixMatch = menuItems
    .filter((item) => !item.end && pathname.startsWith(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return prefixMatch ? prefixMatch.label : fallback;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  areaLabel,
  areaBadge,
  menuItems,
  basePath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const currentTitle = resolvePageTitle(location.pathname, menuItems, areaLabel);
  const workspaces = getAvailableWorkspaces(user);
  const switchableWorkspaces = workspaces.filter((ws) => ws.path !== basePath);
  const primaryRoleLabel = ROLE_LABELS[getPrimaryRole(user)] || "Người dùng";

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "var(--color-bg)",
      }}
    >
      <Sidebar
        areaLabel={areaLabel}
        areaBadge={areaBadge}
        menuItems={menuItems}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: "64px",
            backgroundColor: "var(--color-white)",
            borderBottom: "1px solid var(--color-border)",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Left: Current Area & Page Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-muted)",
              }}
            >
              {areaLabel}
            </span>
            <span style={{ color: "var(--color-slate-300)" }}>/</span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--color-dark)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentTitle}
            </span>
          </div>

          {/* Right: Workspace switcher + User info + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
            {switchableWorkspaces.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  paddingRight: "12px",
                  borderRight: "1px solid var(--color-border)",
                }}
              >
                <ArrowRightLeft size={14} color="var(--color-muted)" />
                {switchableWorkspaces.map((ws) => (
                  <Link
                    key={ws.key}
                    to={ws.path}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--color-forest-700)",
                      backgroundColor: "var(--color-forest-50)",
                      border: "1px solid var(--color-forest-100)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ws.label}
                  </Link>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-forest-50)",
                  border: "1px solid var(--color-forest-200)",
                  color: "var(--color-forest-700)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon size={16} />}
              </div>
              <div style={{ lineHeight: 1.25 }}>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--color-dark)",
                  }}
                >
                  {user?.fullName || "Tài khoản"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-muted)",
                    fontWeight: 500,
                  }}
                >
                  {primaryRoleLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Đăng xuất"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
                padding: "0 14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-white)",
                color: "var(--color-danger)",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 32px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

