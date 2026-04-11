/**
 * API Service for Next.js Backend
 *
 * ✅ FIX #2: Eliminada la cookie de sesión hardcodeada (SESSION_COOKIE).
 * La autenticación se realiza ahora con el JWT de Supabase en el header
 * Authorization: Bearer <access_token>, que el servidor Next.js valida
 * con supabase-admin. Esto previene falsificación de identidad y bypasses de auth.
 */

import { supabase } from '@/services/SupabaseContext';

const NEXT_JS_API_URL = process.env.EXPO_PUBLIC_NEXTJS_API_URL || 'https://notfat.app/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Obtiene el access_token de la sesión activa de Supabase.
 * Si no hay sesión, lanza un error para que el consumidor lo maneje.
 */
const getAuthHeader = async (): Promise<{ Authorization: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No hay sesión activa. Por favor inicia sesión.');
  }
  return { Authorization: `Bearer ${session.access_token}` };
};

export const apiService = {
  /**
   * Base fetch wrapper con autenticación JWT real via Supabase session.
   */
  async request(endpoint: string, options: RequestOptions = {}) {
    const { params, ...fetchOptions } = options;

    let url = `${NEXT_JS_API_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const authHeader = await getAuthHeader();

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...authHeader,
    };

    const finalOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, finalOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[ApiService] Error on ${endpoint}:`, error);
      throw error;
    }
  },

  get(endpoint: string, params?: Record<string, string>) {
    return this.request(endpoint, { method: 'GET', params });
  },

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default apiService;
