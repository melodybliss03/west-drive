const ACCESS_TOKEN_KEY = "westdrive.accessToken";
const REFRESH_TOKEN_KEY = "westdrive.refreshToken";

export function getAccessTokenFromStorage(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessTokenInStorage(accessToken: string | null): void {
  if (!accessToken) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function getRefreshTokenFromStorage(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshTokenInStorage(refreshToken: string | null): void {
  if (!refreshToken) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}
