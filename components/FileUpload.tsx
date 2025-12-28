'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  projectId: string
  onUploadComplete?: (file: any) => void
}

export default function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      // Create file path: projectId/timestamp_filename
      const fileExt = file.name.split('.').pop() || 'bin'
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${projectId}/${timestamp}_${sanitizedName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // If bucket doesn't exist, provide helpful error
        if (uploadError.message.includes('Bucket') || uploadError.message.includes('not found')) {
          throw new Error('Storage bucket "project-files" not found. Please create it in Supabase Storage settings.')
        }
        throw uploadError
      }

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          path: filePath,
          size: file.size,
          mime_type: file.type || null,
        } as any)

      if (dbError) {
        // If upload succeeded but DB failed, try to clean up the storage file
        if (uploadData?.path) {
          await supabase.storage.from('project-files').remove([filePath])
        }
        throw dbError
      }

      // Reset file input
      event.target.value = ''

      // Refresh files list by triggering a custom event
      window.dispatchEvent(new CustomEvent('fileUploaded', { detail: { projectId } }))

      if (onUploadComplete) {
        onUploadComplete({ name: file.name, path: filePath, size: file.size })
      }
    } catch (err: any) {
      console.error('File upload error:', err)
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-400 mb-3">
        Upload File
      </label>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-medium
          file:bg-white/10 file:text-white
          hover:file:bg-white/20
          file:transition-colors file:cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
      {uploading && (
        <p className="mt-2 text-sm text-gray-400">Uploading...</p>
      )}
    </div>
  )
}
