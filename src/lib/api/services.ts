import { apiRequest } from "@/lib/api/client";
import { AuthTokens, PaginatedCollection, ReservationStatus, UserStatus } from "@/lib/api/types";

export type MeResponse = {
  sub: string;
  email: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type UserDto = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  accountType?: "PARTICULIER" | "ENTREPRISE";
  createdAt?: string;
  reservationsCount?: number;
  status?: UserStatus;
  role?: string;
};

export type RegisterPayload = {
  accountType: "PARTICULIER" | "ENTREPRISE";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName?: string;
  siret?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type VehicleImageDto = {
  id?: string;
  url: string;
  sortOrder?: number;
};

export type VehicleDto = {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: "MICRO" | "COMPACTE" | "BERLINE" | "SUV";
  transmission: "MANUELLE" | "AUTOMATIQUE";
  energy: "ESSENCE" | "DIESEL" | "HYBRIDE" | "ELECTRIQUE";
  seats: number;
  includedKmPerDay: number;
  pricePerDay: number;
  description?: string;
  availableCities: string[];
  images?: VehicleImageDto[];
  city?: string;
  available?: boolean;
  operationalStatus?: "DISPONIBLE" | "INDISPONIBLE";
  active?: boolean;
  rating?: number;
  reviewsCount?: number;
};

type PaginationParams = {
  page?: number;
  limit?: number;
};

function toPaginationQuery(params?: PaginationParams): string {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return `?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
}

export type ReservationDto = {
  id: string;
  userId?: string | null;
  vehicleId?: string | null;
  requesterType: "PARTICULIER" | "ENTREPRISE";
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  companyName?: string | null;
  companySiret?: string | null;
  startAt: string;
  endAt: string;
  pickupCity: string;
  requestedVehicleType: string;
  amountTtc: number;
  depositAmount: number;
  status: ReservationStatus;
  vehicleName?: string;
};

export type FleetOverviewDto = {
  bonEtat: number;
  entretienRequis: number;
  enPanne: number;
  totalIncidentsOuverts: number;
};

export type IamPermissionDto = {
  id?: string;
  code: string;
  label?: string;
  description?: string;
};

export type IamRoleDto = {
  id: string;
  name: string;
  description?: string;
  permissionCodes?: string[];
  rolePermissions?: Array<{
    permission?: {
      code?: string;
      label?: string;
      description?: string;
    };
  }>;
};

export const systemService = {
  health: () => apiRequest<{ status: string; uptime?: number }>("/health"),
};

export const authService = {
  register: (payload: RegisterPayload) =>
    apiRequest<{ message: string }>("/auth/register", { method: "POST", body: payload }),

  confirmRegister: (email: string, otp: string) =>
    apiRequest<AuthTokens>("/auth/register/confirm", {
      method: "POST",
      body: { email, otp },
    }),

  login: (email: string, password: string) =>
    apiRequest<AuthTokens>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  refresh: (refreshToken: string) =>
    apiRequest<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: { email, otp, newPassword },
    }),
};

export const usersService = {
  me: () => apiRequest<MeResponse>("/users/me", { auth: true }),
  list: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<UserDto> | UserDto[]>(`/users${toPaginationQuery(params)}`, { auth: true }),
  detail: (id: string) => apiRequest<UserDto>(`/users/${id}`, { auth: true }),
  patchStatus: (id: string, status: UserStatus) =>
    apiRequest<UserDto>(`/users/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
  remove: (id: string) => apiRequest<{ id: string }>(`/users/${id}`, { method: "DELETE", auth: true }),
};

export const vehiclesService = {
  list: (params?: PaginationParams, auth = false) =>
    apiRequest<PaginatedCollection<VehicleDto>>(`/vehicles${toPaginationQuery(params)}`, { auth }),
  detail: (id: string, auth = false) => apiRequest<VehicleDto>(`/vehicles/${id}`, { auth }),
  availability: (id: string, startAt: string, endAt: string) =>
    apiRequest<{ vehicleId: string; available: boolean }>(
      `/vehicles/${id}/availability?startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`
    ),
  create: (payload: Partial<VehicleDto>) =>
    apiRequest<VehicleDto>("/vehicles", { method: "POST", body: payload, auth: true }),
  update: (id: string, payload: Partial<VehicleDto>) =>
    apiRequest<VehicleDto>(`/vehicles/${id}`, { method: "PATCH", body: payload, auth: true }),
  uploadImage: (id: string, file: File, sortOrder?: number) => {
    const formData = new FormData();
    formData.append("file", file);

    const query = sortOrder === undefined ? "" : `?sortOrder=${encodeURIComponent(sortOrder)}`;

    return apiRequest<VehicleImageDto>(`/vehicles/${id}/images/upload${query}`, {
      method: "POST",
      body: formData,
      auth: true,
      isFormData: true,
    });
  },
  removeImage: (id: string, imageId: string) =>
    apiRequest<{ id: string }>(`/vehicles/${id}/images/${imageId}`, {
      method: "DELETE",
      auth: true,
    }),
  remove: (id: string) => apiRequest<{ id: string }>(`/vehicles/${id}`, { method: "DELETE", auth: true }),
};

export const reservationsService = {
  list: () => apiRequest<ReservationDto[]>("/reservations", { auth: true }),
  detail: (id: string) => apiRequest<ReservationDto>(`/reservations/${id}`, { auth: true }),
  create: (payload: Record<string, unknown>) =>
    apiRequest<ReservationDto>("/reservations", { method: "POST", body: payload }),
  patch: (id: string, payload: Record<string, unknown>) =>
    apiRequest<ReservationDto>(`/reservations/${id}`, { method: "PATCH", body: payload, auth: true }),
  patchStatus: (id: string, status: ReservationStatus) =>
    apiRequest<ReservationDto>(`/reservations/${id}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    }),
  preauth: (id: string, amount: number) =>
    apiRequest<{ message?: string }>(`/reservations/${id}/stripe-preauth`, {
      method: "POST",
      body: { amount },
      auth: true,
    }),
};

export const fleetService = {
  overview: () => apiRequest<FleetOverviewDto>("/fleet/overview", { auth: true }),
  vehicles: () => apiRequest<Array<Record<string, unknown>>>("/fleet/vehicles", { auth: true }),
  updateVehicleStatus: (vehicleId: string, operationalStatus: "DISPONIBLE" | "INDISPONIBLE") =>
    apiRequest<Record<string, unknown>>(`/fleet/vehicles/${vehicleId}/status`, {
      method: "PATCH",
      body: { operationalStatus },
      auth: true,
    }),
};

export const iamService = {
  permissions: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<IamPermissionDto> | IamPermissionDto[]>(`/iam/permissions${toPaginationQuery(params)}`, {
      auth: true,
    }),
  roles: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<IamRoleDto> | IamRoleDto[]>(`/iam/roles${toPaginationQuery(params)}`, {
      auth: true,
    }),
  createRole: (payload: { name: string; description?: string; permissionCodes: string[] }) =>
    apiRequest<IamRoleDto>("/iam/roles", {
      method: "POST",
      body: payload,
      auth: true,
    }),
  assignRoleToUser: (roleId: string, userId: string) =>
    apiRequest<{ message?: string }>(`/iam/roles/${roleId}/users/${userId}`, {
      method: "POST",
      auth: true,
    }),
};
