'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface File {
  id: string
  name: string
  size: number
  created_at: string
  path: string
}

interface FilesListProps {
  projectId: string
}

export default function FilesList({ projectId }: FilesListProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchFiles()

    // Listen for file upload events to refresh the list
    const handleFileUploaded = (event: CustomEvent) => {
      if (event.detail?.projectId === projectId) {
        fetchFiles()
      }
    }

    window.addEventListener('fileUploaded', handleFileUploaded as EventListener)
    return () => {
      window.removeEventListener('fileUploaded', handleFileUploaded as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(file.path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Failed to download file: ' + err.message)
    }
  }

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([filePath])

      // Continue even if storage delete fails (file might not exist)
      if (storageError && !storageError.message.includes('not found')) {
        console.warn('Storage delete warning:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      fetchFiles()
    } catch (err: any) {
      console.error('Delete error:', err)
      alert('Failed to delete file: ' + err.message)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading files...</div>
  }

  if (error) {
    // Handle the case where the files table doesn't exist yet
    if (error.includes('schema cache') || error.includes('does not exist')) {
      return (
        <div className="text-gray-500 text-sm py-4 text-center">
          File storage not configured yet
        </div>
      )
    }
    return <div className="text-red-400 text-sm">{error}</div>
  }

  if (files.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-4 text-center">
        No files uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white text-sm truncate">{file.name}</div>
            <div className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2 ml-3">
            <button
              onClick={() => handleDownload(file)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(file.id, file.path)}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
