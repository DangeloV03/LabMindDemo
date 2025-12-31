export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          quiz_responses: Json | null
          status: 'draft' | 'active' | 'completed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          quiz_responses?: Json | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          quiz_responses?: Json | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      notebooks: {
        Row: {
          id: string
          project_id: string
          cells: Json
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          cells: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          cells?: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          path: string
          size: number
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          path: string
          size: number
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          name?: string
          path?: string
          size?: number
          mime_type?: string | null
          created_at?: string
        }
      }
      agent_sessions: {
        Row: {
          id: string
          project_id: string
          steps: Json
          current_step: number
          status: 'planning' | 'executing' | 'completed' | 'error' | 'paused'
          conversation_history: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          steps?: Json
          current_step?: number
          status?: 'planning' | 'executing' | 'completed' | 'error' | 'paused'
          conversation_history?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          steps?: Json
          current_step?: number
          status?: 'planning' | 'executing' | 'completed' | 'error' | 'paused'
          conversation_history?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_status: 'draft' | 'active' | 'completed' | 'archived'
    }
  }
}
