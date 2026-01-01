import { createClient } from '@/lib/supabase/client'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token || null
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const api = {
  projects: {
    list: () => apiRequest<any[]>('/api/projects'),
    get: (id: string) => apiRequest<any>(`/api/projects/${id}`),
    create: (data: { title: string; description?: string; status?: string }) =>
      apiRequest<any>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ title: string; description: string; status: string }>) =>
      apiRequest<any>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<void>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
  },
  agent: {
    analyze: (projectId: string) =>
      apiRequest<any>(`/api/projects/${projectId}/agent/analyze`, {
        method: 'POST',
      }),
    get: (projectId: string) =>
      apiRequest<any>(`/api/projects/${projectId}/agent`),
    updateSteps: (projectId: string, data: { steps: any[] }) =>
      apiRequest<any>(`/api/projects/${projectId}/agent/steps`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    execute: (projectId: string, stepIndex: number) =>
      apiRequest<any>(`/api/projects/${projectId}/agent/execute/${stepIndex}`, {
        method: 'POST',
      }),
    chat: (projectId: string, message: string) =>
      apiRequest<{ response: string }>(`/api/projects/${projectId}/agent/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  },
}
