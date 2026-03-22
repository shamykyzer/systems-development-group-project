import { STORAGE_KEYS } from '../config/constants';

/**
 * Wrapper around fetch that automatically injects the Authorization header
 * using the stored Bearer token. Behaves identically to fetch() in all other respects.
 */
export function authFetch(url, options = {}) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
}
