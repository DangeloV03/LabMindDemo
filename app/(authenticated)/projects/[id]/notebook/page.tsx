import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import NotebookWithAgentIntegration from '@/components/NotebookWithAgentIntegration'
import FileUpload from '@/components/FileUpload'
import FilesList from '@/components/FilesList'

export default async function NotebookPage({
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

  const project = projectData as { id: string; title: string; description: string | null; user_id: string }

  // Fetch notebook data if it exists
  const { data: notebookData } = await supabase
    .from('notebooks')
    .select('*')
    .eq('project_id', id)
    .maybeSingle()

  // Pass the whole notebook object or null
  const notebook = notebookData ? { cells: (notebookData as any).cells } : null

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">{project.title}</h1>
          <p className="text-gray-400 text-sm">Notebook Environment</p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Notebook */}
          <div className="lg:col-span-3">
            <div className="h-[calc(100vh-14rem)]">
              <Suspense fallback={<div className="text-gray-400 p-8">Loading notebook...</div>}>
                <NotebookWithAgentIntegration 
                  projectId={id} 
                  initialContent={notebook}
                />
              </Suspense>
            </div>
          </div>

          {/* Files Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#111111] rounded-2xl border border-white/10 p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Files</h2>
              <FileUpload projectId={id} />
              <FilesList projectId={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}