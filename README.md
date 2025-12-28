# LabMind

AI-Powered Research Analytics Platform for Chemistry & Physics researchers.

## Features

- **Authentication**: Email/password authentication with Supabase
- **Project Management**: Create and manage research projects
- **Interactive Notebook**: Python code execution using Pyodide (runs in browser)
- **File Management**: Upload, download, and manage files for each project
- **AI Agent**: Coming in Phase 3 - AI-powered research assistance

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase:
   - Create a Supabase project at https://supabase.com
   - Run the migration files in order from `supabase/migrations/`:
     - `001_initial_schema.sql`
     - `002_notebooks_table.sql`
     - `003_files_storage.sql`
     - `004_storage_setup.sql`
   - Create a storage bucket named `project-files` (see `supabase/STORAGE_SETUP.md`)

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Backend API

The FastAPI backend is located in the `backend/` directory. See `backend/README.md` for setup instructions.

## Project Structure

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utility functions and configurations
  - `supabase/` - Supabase client setup
  - `pyodide-executor.ts` - Python code execution using Pyodide
- `backend/` - FastAPI backend
- `supabase/migrations/` - Database migration files

## Development Phases

- **Phase 1**: ✅ Authentication & User Management
- **Phase 2**: ✅ Coding Environment (Notebook with Pyodide) & File Storage
- **Phase 3**: 🚧 AI Agent Implementation (Quiz flow & multi-step execution)

## Code Execution

The notebook uses Pyodide to execute Python code directly in the browser. This means:
- Code runs client-side (no backend required for execution)
- Limited to packages available in Pyodide
- Some packages can be installed on-demand using `micropip`

## File Storage

Files are stored in Supabase Storage in the `project-files` bucket. Each file is stored under `{project_id}/{timestamp}_{filename}`.

## License

MIT# LabMindDemo
