// Notebook utility functions

export interface NotebookCell {
  id: string
  type: 'code' | 'markdown'
  content: string
  output?: any
}

export interface Notebook {
  cells: NotebookCell[]
  metadata?: Record<string, any>
}

export function createEmptyNotebook(): Notebook {
  return {
    cells: [
      {
        id: '1',
        type: 'code',
        content: '# Welcome to LabMind Notebook\n# Start coding your analysis here\n\nimport pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\nprint("Notebook ready!")',
      },
    ],
    metadata: {},
  }
}

export function validateNotebook(notebook: any): notebook is Notebook {
  if (!notebook || typeof notebook !== 'object') return false
  if (!Array.isArray(notebook.cells)) return false
  
  return notebook.cells.every((cell: any) => {
    return (
      typeof cell === 'object' &&
      typeof cell.id === 'string' &&
      (cell.type === 'code' || cell.type === 'markdown') &&
      typeof cell.content === 'string'
    )
  })
}
