const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface RequestOptions extends RequestInit {
  bodyData?: any;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

/**
   * Universal fetch-based API client with auto JWT attachment & refresh token rotation
   */
export async function apiRequest(endpoint: string, options: RequestOptions = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Access Token if available in localStorage
  const token = localStorage.getItem('accessToken');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.bodyData) {
    fetchOptions.body = JSON.stringify(options.bodyData);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // If unauthorized, attempt token refresh rotation
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/signup') {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        // No refresh token - logout user
        logoutLocalUser();
        throw new Error('Session expired');
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });

          if (!refreshResponse.ok) {
            throw new Error('Refresh expired');
          }

          const refreshData = await refreshResponse.json();
          localStorage.setItem('accessToken', refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);
          
          isRefreshing = false;
          onRefreshed(refreshData.accessToken);
        } catch (refreshErr) {
          isRefreshing = false;
          logoutLocalUser();
          throw new Error('Session expired');
        }
      }

      // Wait for token refresh to complete and retry request
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          fetch(url, fetchOptions)
            .then(async (retryRes) => {
              if (!retryRes.ok) {
                const errData = await retryRes.json().catch(() => ({}));
                reject(new Error(errData.error || 'Request failed after refresh'));
              } else {
                resolve(await retryRes.json());
              }
            })
            .catch((err) => reject(err));
        });
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'An error occurred during request processing');
    }

    // Handle empty responses (like 204 or logout responses)
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error: any) {
    console.error(`API Request failed for endpoint ${endpoint}:`, error);
    throw error;
  }
}

function logoutLocalUser() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-logout'));
}
