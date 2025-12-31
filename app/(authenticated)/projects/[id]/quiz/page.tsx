import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import QuizFormClient from '@/components/QuizFormClient'

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: projectData, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !projectData) {
    redirect('/projects')
  }

  const project = projectData as { id: string; title: string; quiz_responses: any }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            Research Goal Definition
          </h1>
          <p className="text-gray-400 text-lg">
            Tell us about your research project so our AI agent can help you
          </p>
        </div>

        <QuizFormClient
          projectId={id}
          projectTitle={project.title}
          initialResponses={project.quiz_responses}
        />
      </div>
    </div>
  )
}
