export interface ApiError {
  message: string
  code?: string
  status?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('session_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = response.statusText || 'An unexpected error occurred'
    let code: string | undefined
    try {
      const data = (await response.json()) as Record<string, unknown>
      if (typeof data.message === 'string') message = data.message
      if (typeof data.code === 'string') code = data.code
    } catch {
      // Ignore non-JSON error payloads.
    }

    const error: ApiError = { message, code, status: response.status }
    throw error
  }

  return (await response.json()) as T
}

export const api = {
  get: <T>(url: string): Promise<T> => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown): Promise<T> => request<T>(url, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: <T>(url: string, data?: unknown): Promise<T> => request<T>(url, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  delete: <T>(url: string): Promise<T> => request<T>(url, { method: 'DELETE' }),
}
