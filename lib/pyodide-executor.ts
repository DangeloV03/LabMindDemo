// Pyodide code executor for Python code execution in the browser
// Pyodide is loaded from CDN at runtime, not bundled

let pyodideInstance: any = null
let loadingPromise: Promise<any> | null = null

export async function loadPyodide(): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      // Load Pyodide from CDN (runs in browser only)
      if (typeof window === 'undefined') {
        throw new Error('Pyodide can only be loaded in the browser')
      }

      // Load Pyodide script from CDN if not already loaded
      if (!(window as any).loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          // Check if script is already being loaded
          const existingScript = document.querySelector('script[src*="pyodide.js"]')
          if (existingScript) {
            existingScript.addEventListener('load', () => resolve())
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Pyodide script')))
            return
          }

          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
          script.onload = () => {
            // Give it a moment for the global to be available
            setTimeout(() => resolve(), 100)
          }
          script.onerror = () => reject(new Error('Failed to load Pyodide script'))
          document.head.appendChild(script)
        })
      }

      // Wait a bit if loadPyodide is still not available
      let retries = 0
      while (!(window as any).loadPyodide && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }

      if (!(window as any).loadPyodide) {
        throw new Error('Pyodide loader not available after script load')
      }

      // Load Pyodide instance
      pyodideInstance = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      })

      // Install common packages for data science
      await pyodideInstance.loadPackage(['micropip'])
      
      // Note: Additional packages can be installed on-demand using:
      // const micropip = pyodideInstance.pyimport('micropip')
      // await micropip.install('package-name')
      
      return pyodideInstance
    } catch (error) {
      console.error('Failed to load Pyodide:', error)
      loadingPromise = null
      throw error
    }
  })()

  return loadingPromise
}

export interface ExecutionResult {
  output: string
  error: string | null
  success: boolean
}

export async function executePythonCode(
  code: string,
  globals?: Record<string, any>
): Promise<ExecutionResult> {
  try {
    const pyodide = await loadPyodide()

    // Set up globals if provided
    if (globals) {
      for (const [key, value] of Object.entries(globals)) {
        pyodide.globals.set(key, value)
      }
    }

    // Capture stdout and stderr
    let stdout = ''
    let stderr = ''

    // Set up capture classes
    pyodide.runPython(`
import sys
from io import StringIO

class StdoutCapture:
    def __init__(self):
        self.buffer = StringIO()
    
    def write(self, s):
        if s:
            self.buffer.write(str(s))
            self.buffer.flush()
    
    def flush(self):
        pass
    
    def getvalue(self):
        return self.buffer.getvalue()

class StderrCapture:
    def __init__(self):
        self.buffer = StringIO()
    
    def write(self, s):
        if s:
            self.buffer.write(str(s))
            self.buffer.flush()
    
    def flush(self):
        pass
    
    def getvalue(self):
        return self.buffer.getvalue()

_stdout_capture = StdoutCapture()
_stderr_capture = StderrCapture()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
    `)

    // Execute the code
    try {
      pyodide.runPython(code)
      stdout = pyodide.runPython('_stdout_capture.getvalue()') || ''
      stderr = pyodide.runPython('_stderr_capture.getvalue()') || ''
    } catch (error: any) {
      stderr = error.message || String(error) || ''
    }

    // Restore stdout/stderr
    try {
      pyodide.runPython(`
import sys
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `)
    } catch (e) {
      // Ignore errors during cleanup
    }

    return {
      output: stdout,
      error: stderr || null,
      success: !stderr,
    }
  } catch (error: any) {
    return {
      output: '',
      error: error.message || String(error),
      success: false,
    }
  }
}

export function isPyodideLoaded(): boolean {
  return pyodideInstance !== null
}
