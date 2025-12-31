'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuizForm from './QuizForm'
import { createClient } from '@/lib/supabase/client'

interface QuizFormClientProps {
  projectId: string
  projectTitle: string
  initialResponses?: Record<string, any>
}

export default function QuizFormClient({ projectId, projectTitle, initialResponses }: QuizFormClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleComplete = async (responses: Record<string, any>) => {
    setLoading(true)
    setError(null)

    try {
      // Save quiz responses to project
      const { error: updateError } = await (supabase
        .from('projects') as any)
        .update({
          quiz_responses: responses,
          status: 'active',
        })
        .eq('id', projectId)

      if (updateError) {
        console.error('Error updating project:', updateError)
        throw new Error(updateError.message || 'Failed to save quiz responses')
      }

      // Navigate to agent page to start analysis
      router.push(`/projects/${projectId}/agent`)
    } catch (err: any) {
      console.error('Error in handleComplete:', err)
      setError(err.message || 'Failed to save quiz responses. Please try again.')
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/projects/${projectId}`)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-400">Saving your responses...</p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      <QuizForm
        projectId={projectId}
        initialResponses={initialResponses}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </>
  )
}
