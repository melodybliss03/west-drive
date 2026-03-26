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
  energy: "ESSENCE" | "DIESEL" | "ELECTRIQUE";
  isHybride: boolean;
  seats: number;
  includedKmPerDay: number;
  mileage: number;
  plateNumber?: string;
  pricePerDay: number;
  pricePerHour: number;
  depositAmount?: number;
  description?: string;
  availableCities: string[];
  images?: VehicleImageDto[];
  city?: string;
  available?: boolean;
  operationalStatus?: "DISPONIBLE" | "INDISPONIBLE" | "MAINTENANCE";
  active?: boolean;
  isActive?: boolean;
  rating?: number;
  reviewsCount?: number;
  additionalFeesLabels?: { label: string; amount: number }[];
  maintenanceRequired?: {
    mileage?: number;
    days?: number;
  };
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
  publicReference?: string;
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
  vehicle?: {
    id: string;
    name?: string;
    brand?: string;
    model?: string;
    year?: number;
    category?: string;
    transmission?: string;
    energy?: string;
    seats?: number;
    plateNumber?: string;
    city?: string;
    images?: VehicleImageDto[];
  };
};

export type ReservationsListResponse =
  | PaginatedCollection<ReservationDto>
  | ReservationDto[];

export type FleetOverviewDto = {
  bonEtat: number;
  entretienRequis: number;
  enPanne: number;
  totalIncidentsOuverts: number;
};

export type QuoteStatus =
  | "NOUVELLE_DEMANDE"
  | "EN_ANALYSE"
  | "PROPOSITION_ENVOYEE"
  | "EN_NEGOCIATION"
  | "EN_ATTENTE_PAIEMENT"
  | "PAYEE"
  | "CONVERTI_RESERVATION"
  | "REFUSEE"
  | "ANNULEE";

export type QuoteDto = {
  id: string;
  publicReference: string;
  requesterType: "PARTICULIER" | "ENTREPRISE";
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  companyName?: string | null;
  companySiret?: string | null;
  pickupCity: string;
  requestedVehicleType: string;
  requestedQuantity: number;
  startAt: string;
  endAt: string;
  comment?: string | null;
  status: QuoteStatus;
  amountTtc: number;
  currency: string;
  proposalDetails?: Record<string, unknown> | null;
  proposalMessage?: string | null;
  createdAt: string;
};

export type QuoteEventDto = {
  id: string;
  quoteId: string;
  type: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type FleetIncidentType = "DOMMAGE" | "PANNE" | "HISTORIQUE";
export type FleetIncidentSeverity = "MINEUR" | "MAJEUR" | "CRITIQUE";
export type FleetIncidentStatus = "OUVERT" | "EN_COURS" | "RESOLU";

export type FleetIncidentDto = {
  id: string;
  vehicleId: string;
  incidentType: FleetIncidentType;
  severity: FleetIncidentSeverity;
  status: FleetIncidentStatus;
  description: string;
  openedAt: string;
  resolvedAt?: string | null;
  createdAt: string;
  vehicle?: VehicleDto;
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

export type NotificationDto = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ContactMessagePayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
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
  updateMe: (payload: { email?: string; firstName?: string; lastName?: string; phone?: string }) =>
    apiRequest<UserDto>("/users/me", {
      method: "PATCH",
      body: payload,
      auth: true,
    }),
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

export type ReservationEventDto = {
  id: string;
  type: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
};

export const reservationsService = {
  list: (params?: PaginationParams, userId?: string) => {
    const query = toPaginationQuery(params);
    const userIdParam = userId ? `&userId=${encodeURIComponent(userId)}` : "";
    return apiRequest<ReservationsListResponse>(`/reservations${query}${userIdParam}`, { auth: true });
  },
  detail: (id: string) => apiRequest<ReservationDto>(`/reservations/${id}`, { auth: true }),
  create: (payload: Record<string, unknown>) =>
    apiRequest<ReservationDto>("/reservations", { method: "POST", body: payload }),
  patch: (id: string, payload: Record<string, unknown>) =>
    apiRequest<ReservationDto>(`/reservations/${id}`, { method: "PATCH", body: payload, auth: true }),
  patchStatus: (id: string, status: ReservationStatus, comment?: string) =>
    apiRequest<ReservationDto>(`/reservations/${id}/status`, {
      method: "PATCH",
      body: { status, comment },
      auth: true,
    }),
  preauth: (id: string, amount: number) =>
    apiRequest<{ message?: string }>(`/reservations/${id}/stripe-preauth`, {
      method: "POST",
      body: { amount },
    }),
  createPaymentSession: (id: string) =>
    apiRequest<{ checkoutUrl: string; sessionId: string }>(
      `/reservations/${id}/payment-session`,
      {
        method: "POST",
      },
    ),
  createPaymentLink: (id: string) =>
    apiRequest<{ paymentLinkUrl: string }>(
      `/reservations/${id}/payment-link`,
      {
        method: "POST",
      },
    ),
  confirmPayment: (id: string, sessionId: string) =>
    apiRequest<ReservationDto>(`/reservations/${id}/payment-confirmation`, {
      method: "POST",
      body: { sessionId },
    }),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/reservations/${id}`, {
      method: "DELETE",
      auth: true,
    }),
  createEvent: (id: string, payload: { type: string; occurredAt?: string; payload?: Record<string, unknown> }) =>
    apiRequest<ReservationEventDto>(`/reservations/${id}/events`, {
      method: "POST",
      body: payload,
      auth: true,
    }),
  findEvents: (id: string, params?: PaginationParams) =>
    apiRequest<PaginatedCollection<ReservationEventDto> | ReservationEventDto[]>(
      `/reservations/${id}/events${toPaginationQuery(params)}`,
      { auth: true }
    ),
};

export const quotesService = {
  list: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<QuoteDto> | QuoteDto[]>(
      `/quotes${toPaginationQuery(params)}`,
      { auth: true },
    ),
  create: (payload: {
    requesterType: "PARTICULIER" | "ENTREPRISE";
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    companyName?: string;
    companySiret?: string;
    pickupCity: string;
    requestedVehicleType: string;
    requestedQuantity: number;
    startAt: string;
    endAt: string;
    comment?: string;
  }) =>
    apiRequest<QuoteDto>("/quotes", {
      method: "POST",
      body: payload,
    }),
  sendProposal: (
    id: string,
    payload: {
      amountTtc: number;
      currency?: string;
      proposalDetails?: Record<string, unknown>;
      message?: string;
    },
  ) =>
    apiRequest<{ quote: QuoteDto; checkoutUrl: string; sessionId: string }>(
      `/quotes/${id}/proposal`,
      {
        method: "POST",
        body: payload,
        auth: true,
      },
    ),
  startAnalysis: (id: string, comment?: string) =>
    apiRequest<QuoteDto>(`/quotes/${id}/analysis`, {
      method: "POST",
      body: { comment },
      auth: true,
    }),
  startNegotiation: (id: string, message?: string) =>
    apiRequest<QuoteDto>(`/quotes/${id}/negotiation`, {
      method: "POST",
      body: { message },
      auth: true,
    }),
  updateStatus: (id: string, status: QuoteStatus, comment?: string) =>
    apiRequest<QuoteDto>(`/quotes/${id}/status`, {
      method: "PATCH",
      body: { status, comment },
      auth: true,
    }),
  convertToReservation: (
    id: string,
    payload?: {
      vehicleId?: string;
      amountTtc?: number;
      depositAmount?: number;
    },
  ) =>
    apiRequest<{ quote: QuoteDto; reservationId: string; reservationPublicReference: string }>(
      `/quotes/${id}/convert-to-reservation`,
      {
        method: "POST",
        body: payload ?? {},
        auth: true,
      },
    ),
  findEvents: (id: string, params?: PaginationParams) =>
    apiRequest<PaginatedCollection<QuoteEventDto> | QuoteEventDto[]>(
      `/quotes/${id}/events${toPaginationQuery(params)}`,
      { auth: true },
    ),
  remove: (id: string) =>
    apiRequest<{ message: string }>(`/quotes/${id}`, {
      method: "DELETE",
      auth: true,
    }),
  createPaymentSession: (id: string) =>
    apiRequest<{ checkoutUrl: string; sessionId: string }>(
      `/quotes/${id}/payment-session`,
      {
        method: "POST",
      },
    ),
  createPaymentLink: (id: string) =>
    apiRequest<{ paymentLinkUrl: string }>(
      `/quotes/${id}/payment-link`,
      {
        method: "POST",
      },
    ),
  confirmPayment: (id: string, sessionId: string) =>
    apiRequest<QuoteDto>(`/quotes/${id}/payment-confirmation`, {
      method: "POST",
      body: { sessionId },
    }),
};

export const contactService = {
  createMessage: (payload: ContactMessagePayload) =>
    apiRequest<{ message: string }>("/contact/messages", {
      method: "POST",
      body: payload,
    }),
};

export const fleetService = {
  overview: () => apiRequest<FleetOverviewDto>("/fleet/overview", { auth: true }),
  vehicles: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<VehicleDto> | VehicleDto[]>(`/fleet/vehicles${toPaginationQuery(params)}`, { auth: true }),
  updateVehicleStatus: (vehicleId: string, operationalStatus: "DISPONIBLE" | "INDISPONIBLE" | "MAINTENANCE") =>
    apiRequest<VehicleDto>(`/fleet/vehicles/${vehicleId}/status`, {
      method: "PATCH",
      body: { operationalStatus },
      auth: true,
    }),
  updateVehicleMileage: (vehicleId: string, mileage: number) =>
    apiRequest<VehicleDto>(`/fleet/vehicles/${vehicleId}/mileage`, {
      method: "PATCH",
      body: { mileage },
      auth: true,
    }),
  createIncident: (payload: {
    vehicleId: string;
    incidentType: FleetIncidentType;
    severity: FleetIncidentSeverity;
    description: string;
    status?: FleetIncidentStatus;
    openedAt?: string;
    resolvedAt?: string;
  }) =>
    apiRequest<FleetIncidentDto>("/fleet/incidents", {
      method: "POST",
      body: payload,
      auth: true,
    }),
  listIncidents: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<FleetIncidentDto> | FleetIncidentDto[]>(
      `/fleet/incidents${toPaginationQuery(params)}`,
      { auth: true },
    ),
  updateIncident: (
    incidentId: string,
    payload: {
      vehicleId?: string;
      incidentType?: FleetIncidentType;
      severity?: FleetIncidentSeverity;
      status?: FleetIncidentStatus;
      description?: string;
      openedAt?: string;
      resolvedAt?: string;
    },
  ) =>
    apiRequest<FleetIncidentDto>(`/fleet/incidents/${incidentId}`, {
      method: "PATCH",
      body: payload,
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
  inviteAndAssignRoleByEmail: (roleId: string, email: string) =>
    apiRequest<{ roleId: string; userId: string; invited: boolean }>(
      `/iam/roles/${roleId}/invite`,
      {
        method: "POST",
        body: { email },
        auth: true,
      },
    ),
};

export const notificationsService = {
  list: (params?: PaginationParams) =>
    apiRequest<PaginatedCollection<NotificationDto> | NotificationDto[]>(
      `/notifications${toPaginationQuery(params)}`,
      { auth: true }
    ),
  markAsRead: (id: string) =>
    apiRequest<NotificationDto>(`/notifications/${id}/read`, {
      method: "PATCH",
      auth: true,
    }),
  markAllAsRead: () =>
    apiRequest<{ message: string }>(`/notifications/read-all`, {
      method: "PATCH",
      auth: true,
    }),
};
