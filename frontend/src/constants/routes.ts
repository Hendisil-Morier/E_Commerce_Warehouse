export const ROUTES = {
  // Storefront & Auth
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORBIDDEN: "/forbidden",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:id",
  CART: "/cart",
  ORDERS: "/orders",
  BECOME_SELLER: "/become-seller",

  // Seller Area (/seller)
  SELLER: "/seller",
  SELLER_SHOPS: "/seller/shops",
  SELLER_PRODUCTS: "/seller/products",
  SELLER_PRODUCT_NEW: "/seller/products/new",
  SELLER_PRODUCT_EDIT: "/seller/products/:id/edit",
  SELLER_ORDERS: "/seller/orders",
  SELLER_ORDER_DETAIL: "/seller/orders/:id",
  SELLER_INVENTORY: "/seller/inventory",
  SELLER_RETURNS: "/seller/returns",
  SELLER_PROFILE: "/seller/profile",

  // Warehouse Area (/warehouse)
  WAREHOUSE: "/warehouse",
  WAREHOUSE_LIST: "/warehouse/warehouses",
  WAREHOUSE_LOCATIONS: "/warehouse/warehouses/:id/locations",
  WAREHOUSE_INVENTORY: "/warehouse/inventory",
  WAREHOUSE_STOCK_MOVEMENTS: "/warehouse/stock-movements",
  WAREHOUSE_RECEIPTS: "/warehouse/receipts",
  WAREHOUSE_RECEIPT_NEW: "/warehouse/receipts/new",
  WAREHOUSE_RECEIPT_DETAIL: "/warehouse/receipts/:id",
  WAREHOUSE_ISSUES: "/warehouse/issues",
  WAREHOUSE_ISSUE_DETAIL: "/warehouse/issues/:id",
  WAREHOUSE_ISSUE_PICK: "/warehouse/issues/:id/pick",
  WAREHOUSE_SHIPMENTS: "/warehouse/shipments",
  WAREHOUSE_RETURNS: "/warehouse/returns",

  // Admin Area (/admin)
  ADMIN: "/admin",
  ADMIN_SELLERS: "/admin/sellers",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_ORDERS: "/admin/orders",
  ADMIN_RETURNS: "/admin/returns",
  ADMIN_REFUNDS: "/admin/refunds",
  ADMIN_USERS: "/admin/users",
  ADMIN_CATEGORIES: "/admin/categories",
} as const;
