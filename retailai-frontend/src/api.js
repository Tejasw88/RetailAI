// API base URL: uses VITE_API_URL in production, empty string in dev (Vite proxy)
export const API_URL = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
    return `${API_URL}${path}`;
}
