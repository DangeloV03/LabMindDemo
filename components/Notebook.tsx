'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotebookCell } from '@/lib/notebook'
import { executePythonCode, loadPyodide, isPyodideLoaded } from '@/lib/pyodide-executor'

interface NotebookProps {
  projectId: string
  initialContent?: any
  onSave?: (content: any) => void
}

export default function Notebook({ projectId, initialContent, onSave }: NotebookProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const notebookRef = useRef<any>(null)

  useEffect(() => {
    // For now, we'll create a simple code editor interface
    // JupyterLite full integration will be added in a future update
    // This provides a basic notebook-like interface
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading notebook environment...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full glass border border-white/10 rounded-2xl overflow-hidden">
      <NotebookEditor projectId={projectId} initialContent={initialContent} onSave={onSave} />
    </div>
  )
}

function NotebookEditor({ projectId, initialContent, onSave }: NotebookProps) {
  const [cells, setCells] = useState<NotebookCell[]>(
    initialContent?.cells || [
      { id: '1', type: 'code', content: '# Welcome to LabMind Notebook\n# Start coding your analysis here\n\nprint("Hello from Pyodide!")\nprint("Python", 3 + 2)' },
    ]
  )
  const [executing, setExecuting] = useState<string | null>(null)
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const supabase = createClient()

  // Load Pyodide on mount
  useEffect(() => {
    if (!isPyodideLoaded() && !pyodideLoading) {
      setPyodideLoading(true)
      loadPyodide()
        .then(() => {
          setPyodideReady(true)
          setPyodideLoading(false)
        })
        .catch((error) => {
          console.error('Failed to load Pyodide:', error)
          setPyodideLoading(false)
        })
    } else if (isPyodideLoaded()) {
      setPyodideReady(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addCell = (type: 'code' | 'markdown' = 'code') => {
    const newCell = {
      id: Date.now().toString(),
      type,
      content: type === 'markdown' ? '# Markdown cell' : '',
    }
    setCells([...cells, newCell])
  }

  const updateCell = (id: string, content: string) => {
    setCells(cells.map(cell => cell.id === id ? { ...cell, content } : cell))
  }

  const deleteCell = (id: string) => {
    setCells(cells.filter(cell => cell.id !== id))
    const newOutputs = { ...outputs }
    delete newOutputs[id]
    setOutputs(newOutputs)
  }

  const executeCell = async (id: string) => {
    const cell = cells.find(c => c.id === id)
    if (!cell || cell.type !== 'code') return

    setExecuting(id)

    try {
      if (!pyodideReady) {
        // Try to load Pyodide if not ready
        if (!pyodideLoading) {
          setPyodideLoading(true)
          await loadPyodide()
          setPyodideReady(true)
          setPyodideLoading(false)
        } else {
          throw new Error('Pyodide is still loading. Please wait...')
        }
      }

      // Execute Python code
      const result = await executePythonCode(cell.content)

      setOutputs({
        ...outputs,
        [id]: {
          type: result.success ? 'output' : 'error',
          content: result.success ? result.output : result.error,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      setOutputs({
        ...outputs,
        [id]: {
          type: 'error',
          content: `Error: ${error.message || String(error)}`,
          timestamp: new Date().toISOString(),
        },
      })
    } finally {
      setExecuting(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cellsData = cells.map(cell => ({
        id: cell.id,
        type: cell.type,
        content: cell.content,
        output: outputs[cell.id] || null,
      }))

      // Upsert notebook to Supabase
      const { error } = await supabase
        .from('notebooks')
        .upsert({
          project_id: projectId,
          cells: cellsData,
        } as any, {
          onConflict: 'project_id',
        })

      if (error) {
        console.error('Save error details:', error)
        throw error
      }

      console.log('Notebook saved successfully with', cellsData.length, 'cells')

      if (onSave) {
        onSave({ cells: cellsData })
      }
    } catch (error: any) {
      console.error('Error saving notebook:', error)
      alert('Failed to save notebook: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => addCell('code')}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              + Code
            </button>
            <button
              onClick={() => addCell('markdown')}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              + Markdown
            </button>
          </div>
          {pyodideLoading && (
            <span className="text-xs text-gray-400">Loading Python runtime...</span>
          )}
          {pyodideReady && !pyodideLoading && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              Python ready
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Cells */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cells.map((cell, index) => (
          <div key={cell.id} className="glass border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-white/[0.02] px-4 py-2 border-b border-white/10">
              <span className="text-xs text-gray-500">
                Cell {index + 1} ({cell.type})
              </span>
              <div className="flex gap-2">
                {cell.type === 'code' && (
                  <button
                    onClick={() => executeCell(cell.id)}
                    disabled={executing === cell.id}
                    className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                  >
                    {executing === cell.id ? 'Running...' : 'Run'}
                  </button>
                )}
                <button
                  onClick={() => deleteCell(cell.id)}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            
            {cell.type === 'code' ? (
              <textarea
                value={cell.content}
                onChange={(e) => updateCell(cell.id, e.target.value)}
                className="w-full p-4 font-mono text-sm bg-[#0d0d0d] text-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none placeholder-gray-600"
                rows={Math.max(5, cell.content.split('\n').length)}
                placeholder="Enter Python code here..."
              />
            ) : (
              <textarea
                value={cell.content}
                onChange={(e) => updateCell(cell.id, e.target.value)}
                className="w-full p-4 text-sm bg-[#0d0d0d] text-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none placeholder-gray-600"
                rows={Math.max(3, cell.content.split('\n').length)}
                placeholder="Enter Markdown here..."
              />
            )}

            {outputs[cell.id] && cell.type === 'code' && (
              <div className={`p-4 font-mono text-sm border-t border-white/10 ${
                outputs[cell.id].type === 'error' 
                  ? 'bg-red-950/20 text-red-400' 
                  : 'bg-[#0a0a0a] text-green-400'
              }`}>
                <div className="text-gray-500 text-xs mb-2">
                  {outputs[cell.id].type === 'error' ? 'Error:' : 'Output:'}
                </div>
                <pre className="whitespace-pre-wrap break-words">{outputs[cell.id].content || '(no output)'}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
