export type SellerStatus = "Pending" | "Approved" | "Rejected" | "Suspended";

export interface SellerUserSummary {
  userId: number;
  username: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
}

export interface SellerProfile {
  sellerId: number;
  userId: number;
  businessName: string;
  taxCode: string | null;
  description: string | null;
  commissionRate: number;
  status: SellerStatus;
  approvedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: SellerUserSummary | null;
}

export interface RegisterSellerRequest {
  businessName: string;
  taxCode?: string;
  description?: string;
}

export interface RejectSellerRequest {
  reason: string;
}

export interface SuspendSellerRequest {
  reason?: string;
}

export interface AdminSellerListQuery {
  status?: SellerStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

