export type ApiSuccess<T> = {
  status: "success";
  code: number;
  data: T;
  message: string;
};

export type ApiErrorPayload = {
  path?: string;
  timestamp?: string;
  [key: string]: unknown;
};

export type ApiErrorEnvelope = {
  status: "error";
  code: number;
  data?: ApiErrorPayload;
  message: string;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorEnvelope;

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedCollection<T> = {
  items: T[];
  meta: PaginationMeta;
};

export class ApiHttpError extends Error {
  code: number;
  path?: string;
  timestamp?: string;

  constructor(message: string, code: number, data?: ApiErrorPayload) {
    super(message);
    this.name = "ApiHttpError";
    this.code = code;
    this.path = data?.path as string | undefined;
    this.timestamp = data?.timestamp as string | undefined;
  }
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
};

export type AccountType = "PARTICULIER" | "ENTREPRISE";

export type UserStatus = "ACTIF" | "SUSPENDU";

export type OperationalStatus = "DISPONIBLE" | "INDISPONIBLE";

export type ReservationStatus =
  | "NOUVELLE_DEMANDE"
  | "EN_ANALYSE"
  | "PROPOSITION_ENVOYEE"
  | "EN_ATTENTE_PAIEMENT"
  | "CONFIRMEE"
  | "EN_COURS"
  | "CLOTUREE"
  | "ANNULEE"
  | "REFUSEE";
