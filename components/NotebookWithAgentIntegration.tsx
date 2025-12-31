'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Notebook from './Notebook'
import { createClient } from '@/lib/supabase/client'

interface NotebookWithAgentIntegrationProps {
  projectId: string
  initialContent?: any
}

export default function NotebookWithAgentIntegration({
  projectId,
  initialContent,
}: NotebookWithAgentIntegrationProps) {
  const searchParams = useSearchParams()
  const stepParam = searchParams.get('step')
  const [agentStepCode, setAgentStepCode] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // If step parameter is provided, fetch the agent step code
    if (stepParam) {
      fetchAgentStepCode(parseInt(stepParam))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParam])

  const fetchAgentStepCode = async (stepIndex: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects/${projectId}/agent`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (response.ok) {
        const agentSession = await response.json()
        const steps = agentSession.steps || []
        if (stepIndex >= 0 && stepIndex < steps.length) {
          setAgentStepCode(steps[stepIndex].code)
        }
      }
    } catch (error) {
      console.error('Error fetching agent step:', error)
    }
  }

  // If agent step code is available, prepend it to initial content
  const enhancedInitialContent = agentStepCode
    ? {
        cells: [
          {
            id: 'agent-step',
            type: 'code',
            content: `# Agent Step ${stepParam}\n${agentStepCode}`,
          },
          ...(initialContent?.cells || []),
        ],
      }
    : initialContent

  return <Notebook projectId={projectId} initialContent={enhancedInitialContent} />
}
