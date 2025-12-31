'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentStepsView from './AgentStepsView'
import AgentChat from './AgentChat'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'

interface AgentDashboardProps {
  projectId: string
  initialSession?: any
}

interface Step {
  step_number: number
  title: string
  description: string
  code: string
  dependencies: number[]
}

export default function AgentDashboard({ projectId, initialSession }: AgentDashboardProps) {
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const supabase = createClient()

  const fetchSession = async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/agent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data)
      } else if (response.status === 404) {
        // Session doesn't exist yet, need to analyze - this is expected
        setSession(null)
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch agent session' }))
        setError(errorData.detail || `Error ${response.status}: Failed to fetch agent session`)
      }
    } catch (err: any) {
      // Network error or backend not running - this is okay if no session exists yet
      // We'll show the "Generate Research Plan" button instead
      console.error('Error fetching agent session:', err)
      setSession(null)
      // Only show error if we had a session before (which would indicate a real problem)
      if (session) {
        setError('Failed to connect to backend. Please check if the backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  useEffect(() => {
    if (!session) {
      // Try to fetch session
      fetchSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/agent/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to analyze research goal' }))
        throw new Error(errorData.detail || `Error ${response.status}: Failed to analyze research goal`)
      }

      const data = await response.json()
      setSession(data)
    } catch (err: any) {
      console.error('Error analyzing research goal:', err)
      if (err.message.includes('fetch')) {
        setError('Failed to connect to backend. Please ensure the backend server is running at http://localhost:8000')
      } else {
        setError(err.message || 'Failed to generate research plan')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStepExecute = async (stepIndex: number) => {
    try {
      const token = await getAuthToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/agent/execute/${stepIndex}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to execute step')

      const updatedSession = await response.json()
      setSession(updatedSession)

      // Navigate to notebook to execute the code
      router.push(`/projects/${projectId}/notebook?step=${stepIndex}`)
    } catch (err: any) {
      setError(err.message || 'Failed to execute step')
    }
  }

  const handleStepSelect = (stepIndex: number) => {
    // Navigate to notebook with this step's code
    router.push(`/projects/${projectId}/notebook?step=${stepIndex}`)
  }

  const handleStepModify = async (stepIndex: number, modifiedStep: Step) => {
    try {
      const updatedSteps = [...(session.steps || [])]
      updatedSteps[stepIndex] = modifiedStep

      const token = await getAuthToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/agent/steps`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steps: updatedSteps }),
      })

      if (!response.ok) throw new Error('Failed to update step')

      const updatedSession = await response.json()
      setSession(updatedSession)
    } catch (err: any) {
      setError(err.message || 'Failed to update step')
    }
  }

  const handleChatMessage = async (message: string): Promise<string> => {
    const token = await getAuthToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/agent/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get response')
    }

    const data = await response.json()
    return data.response
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-400">Loading agent session...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Generate Research Plan</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          The AI agent will analyze your research goal and create a step-by-step plan
        </p>
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg max-w-md mx-auto">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating plan...
            </span>
          ) : (
            'Generate Research Plan'
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Steps View */}
        <div className="lg:col-span-2">
          <AgentStepsView
            steps={session.steps || []}
            currentStep={session.current_step || 0}
            status={session.status || 'planning'}
            onStepSelect={handleStepSelect}
            onStepExecute={handleStepExecute}
            onStepModify={handleStepModify}
          />
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <div className="h-[600px]">
            <AgentChat
              projectId={projectId}
              initialHistory={session.conversation_history || []}
              onSendMessage={handleChatMessage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
