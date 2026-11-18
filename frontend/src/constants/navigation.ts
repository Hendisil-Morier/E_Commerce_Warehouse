import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  Boxes,
  FileText,
  FolderTree,
  LayoutDashboard,
  Package,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Store,
  Truck,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/utils/roleUtils";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: readonly string[];
  end?: boolean;
}

export const SELLER_MENU: NavItem[] = [
  {
    label: "Tổng quan",
    path: ROUTES.SELLER,
    icon: LayoutDashboard,
    roles: [ROLES.SELLER],
    end: true,
  },
  {
    label: "Shop",
    path: ROUTES.SELLER_SHOPS,
    icon: Store,
    roles: [ROLES.SELLER],
  },
  {
    label: "Sản phẩm",
    path: ROUTES.SELLER_PRODUCTS,
    icon: Package,
    roles: [ROLES.SELLER],
  },
  {
    label: "Đơn hàng",
    path: ROUTES.SELLER_ORDERS,
    icon: ShoppingBag,
    roles: [ROLES.SELLER],
  },
  {
    label: "Tồn kho",
    path: ROUTES.SELLER_INVENTORY,
    icon: Boxes,
    roles: [ROLES.SELLER],
  },
  {
    label: "Trả hàng",
    path: ROUTES.SELLER_RETURNS,
    icon: RotateCcw,
    roles: [ROLES.SELLER],
  },
  {
    label: "Hồ sơ",
    path: ROUTES.SELLER_PROFILE,
    icon: UserCog,
    roles: [ROLES.SELLER],
  },
];

export const WAREHOUSE_MENU: NavItem[] = [
  {
    label: "Tổng quan",
    path: ROUTES.WAREHOUSE,
    icon: LayoutDashboard,
    roles: [ROLES.WAREHOUSE_MANAGER],
    end: true,
  },
  {
    label: "Kho và vị trí",
    path: ROUTES.WAREHOUSE_LIST,
    icon: Warehouse,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
  {
    label: "Tồn kho",
    path: ROUTES.WAREHOUSE_INVENTORY,
    icon: Boxes,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
  {
    label: "Thẻ kho",
    path: ROUTES.WAREHOUSE_STOCK_MOVEMENTS,
    icon: FileText,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
  {
    label: "Phiếu nhập",
    path: ROUTES.WAREHOUSE_RECEIPTS,
    icon: ArrowDownToLine,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
  {
    label: "Phiếu xuất",
    path: ROUTES.WAREHOUSE_ISSUES,
    icon: ArrowUpFromLine,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
  {
    label: "Vận đơn",
    path: ROUTES.WAREHOUSE_SHIPMENTS,
    icon: Truck,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
  {
    label: "Hàng trả về",
    path: ROUTES.WAREHOUSE_RETURNS,
    icon: PackageCheck,
    roles: [ROLES.WAREHOUSE_MANAGER],
  },
];

export const ADMIN_MENU: NavItem[] = [
  {
    label: "Tổng quan",
    path: ROUTES.ADMIN,
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN],
    end: true,
  },
  {
    label: "Seller",
    path: ROUTES.ADMIN_SELLERS,
    icon: Store,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Sản phẩm",
    path: ROUTES.ADMIN_PRODUCTS,
    icon: PackageCheck,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Đơn hàng",
    path: ROUTES.ADMIN_ORDERS,
    icon: ShoppingBag,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Trả hàng",
    path: ROUTES.ADMIN_RETURNS,
    icon: RotateCcw,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Hoàn tiền",
    path: ROUTES.ADMIN_REFUNDS,
    icon: BadgeDollarSign,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Người dùng",
    path: ROUTES.ADMIN_USERS,
    icon: Users,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Danh mục",
    path: ROUTES.ADMIN_CATEGORIES,
    icon: FolderTree,
    roles: [ROLES.ADMIN],
  },
];

