'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentStepsView from './AgentStepsView'
import AgentChat from './AgentChat'
import { createClient } from '@/lib/supabase/client'
import { api, API_BASE_URL } from '@/lib/api'

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
      const data = await api.agent.get(projectId)
      setSession(data)
    } catch (err: any) {
      // 404 is expected when no session exists yet - this is fine
      // Network errors are also okay if no session exists yet
      // We'll show the "Generate Research Plan" button instead
      console.error('Error fetching agent session:', err)
      
      // Check if it's a 404 (session doesn't exist) - this is expected
      const is404 = err.message.includes('404') || err.message.includes('status: 404')
      if (is404) {
        setSession(null)
        return
      }
      
      setSession(null)
      // Only show error if we had a session before (which would indicate a real problem)
      if (session) {
        const isNetworkError = err.message.includes('fetch') || err.message.includes('Failed to fetch')
        if (isNetworkError) {
          setError(`Failed to connect to backend API at ${API_BASE_URL}. Please check if the backend server is running and the NEXT_PUBLIC_API_URL environment variable is configured correctly.`)
        } else {
          setError(err.message || 'Failed to fetch agent session')
        }
      }
    } finally {
      setLoading(false)
    }
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
      const data = await api.agent.analyze(projectId)
      setSession(data)
    } catch (err: any) {
      console.error('Error analyzing research goal:', err)
      const isNetworkError = err.message.includes('fetch') || err.message.includes('Failed to fetch')
      if (isNetworkError) {
        setError(`Failed to connect to backend API at ${API_BASE_URL}. Please ensure the backend server is running and the NEXT_PUBLIC_API_URL environment variable is configured correctly.`)
      } else {
        setError(err.message || 'Failed to generate research plan')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStepExecute = async (stepIndex: number) => {
    try {
      const updatedSession = await api.agent.execute(projectId, stepIndex)
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

      const updatedSession = await api.agent.updateSteps(projectId, { steps: updatedSteps })
      setSession(updatedSession)
    } catch (err: any) {
      setError(err.message || 'Failed to update step')
    }
  }

  const handleChatMessage = async (message: string): Promise<string> => {
    const data = await api.agent.chat(projectId, message)
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
