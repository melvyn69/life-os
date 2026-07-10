export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      briefings: {
        Row: {
          content: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      captures: {
        Row: {
          content: string
          created_at: string
          id: string
          sensitivity: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sensitivity?: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sensitivity?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          confidence: string
          created_at: string
          description: string | null
          id: string
          name: string
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sensitivity?: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sensitivity?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_duplicate_candidates: {
        Row: {
          candidate_name: string | null
          confidence: string
          created_at: string
          duplicate_entity_id: string
          entity_id: string | null
          id: string
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_name?: string | null
          confidence?: string
          created_at?: string
          duplicate_entity_id: string
          entity_id?: string | null
          id?: string
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_name?: string | null
          confidence?: string
          created_at?: string
          duplicate_entity_id?: string
          entity_id?: string | null
          id?: string
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_duplicate_candidates_duplicate_entity_id_fkey"
            columns: ["duplicate_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_duplicate_candidates_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          confidence: string
          content: string
          created_at: string
          entity_id: string | null
          id: string
          observation_id: string | null
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string
          content: string
          created_at?: string
          entity_id?: string | null
          id?: string
          observation_id?: string | null
          sensitivity?: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string
          content?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          observation_id?: string | null
          sensitivity?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_contradictions: {
        Row: {
          confidence: string
          contradiction_type: string
          created_at: string
          entity_id: string | null
          existing_content: string
          existing_record_type: string
          id: string
          memory_id: string | null
          new_content: string
          observation_id: string | null
          reason: string
          resolution_status: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string
          contradiction_type: string
          created_at?: string
          entity_id?: string | null
          existing_content: string
          existing_record_type: string
          id?: string
          memory_id?: string | null
          new_content: string
          observation_id?: string | null
          reason: string
          resolution_status?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string
          contradiction_type?: string
          created_at?: string
          entity_id?: string | null
          existing_content?: string
          existing_record_type?: string
          id?: string
          memory_id?: string | null
          new_content?: string
          observation_id?: string | null
          reason?: string
          resolution_status?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_contradictions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_contradictions_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_contradictions_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_evidence: {
        Row: {
          created_at: string
          direction: string
          entity_id: string | null
          id: string
          memory_id: string | null
          observation_id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          entity_id?: string | null
          id?: string
          memory_id?: string | null
          observation_id: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          entity_id?: string | null
          id?: string
          memory_id?: string | null
          observation_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_evidence_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_evidence_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_evidence_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_history_events: {
        Row: {
          created_at: string
          current_state: Json
          entity_id: string | null
          event_type: string
          evidence_ids: string[]
          evidence_observation_ids: string[]
          has_unresolved_contradiction: boolean
          id: string
          memory_id: string | null
          previous_state: Json | null
          reason: string
          record_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_state: Json
          entity_id?: string | null
          event_type: string
          evidence_ids?: string[]
          evidence_observation_ids?: string[]
          has_unresolved_contradiction?: boolean
          id?: string
          memory_id?: string | null
          previous_state?: Json | null
          reason: string
          record_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_state?: Json
          entity_id?: string | null
          event_type?: string
          evidence_ids?: string[]
          evidence_observation_ids?: string[]
          has_unresolved_contradiction?: boolean
          id?: string
          memory_id?: string | null
          previous_state?: Json | null
          reason?: string
          record_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_history_events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_history_events_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          capture_id: string | null
          confidence: string
          content: string
          created_at: string
          id: string
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capture_id?: string | null
          confidence?: string
          content: string
          created_at?: string
          id?: string
          sensitivity?: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capture_id?: string | null
          confidence?: string
          content?: string
          created_at?: string
          id?: string
          sensitivity?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_evidence: {
        Row: {
          capture_id: string | null
          created_at: string
          evidence_kind: string
          excerpt: string | null
          id: string
          memory_id: string | null
          observation_id: string | null
          observed_at: string | null
          relation_to_claim: string
          relationship_id: string
          source_fingerprint: string
          source_sensitivity: string
          source_strength: string
          user_id: string
        }
        Insert: {
          capture_id?: string | null
          created_at?: string
          evidence_kind: string
          excerpt?: string | null
          id?: string
          memory_id?: string | null
          observation_id?: string | null
          observed_at?: string | null
          relation_to_claim: string
          relationship_id: string
          source_fingerprint: string
          source_sensitivity: string
          source_strength: string
          user_id: string
        }
        Update: {
          capture_id?: string | null
          created_at?: string
          evidence_kind?: string
          excerpt?: string | null
          id?: string
          memory_id?: string | null
          observation_id?: string | null
          observed_at?: string | null
          relation_to_claim?: string
          relationship_id?: string
          source_fingerprint?: string
          source_sensitivity?: string
          source_strength?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_evidence_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_evidence_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_evidence_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_evidence_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_history: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          evidence_ids: string[]
          id: string
          reason: string | null
          relationship_id: string
          user_id: string
        }
        Insert: {
          action: string
          actor_type: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          evidence_ids?: string[]
          id?: string
          reason?: string | null
          relationship_id: string
          user_id: string
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          evidence_ids?: string[]
          id?: string
          reason?: string | null
          relationship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_history_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          candidate_fingerprint: string
          confidence?: string
          created_at?: string
          created_by: string
          date_precision?: string
          end_date?: string | null
          evidence_set_hash?: string | null
          explanation?: string | null
          first_observed_at?: string | null
          id?: string
          is_directional: boolean
          is_visible?: boolean
          last_confirmed_at?: string | null
          last_observed_at?: string | null
          relationship_type: string
          sensitivity?: string
          source_entity_id: string
          start_date?: string | null
          status?: string
          target_entity_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          candidate_fingerprint?: string
          confidence?: string
          created_at?: string
          created_by?: string
          date_precision?: string
          end_date?: string | null
          evidence_set_hash?: string | null
          explanation?: string | null
          first_observed_at?: string | null
          id?: string
          is_directional?: boolean
          is_visible?: boolean
          last_confirmed_at?: string | null
          last_observed_at?: string | null
          relationship_type?: string
          sensitivity?: string
          source_entity_id?: string
          start_date?: string | null
          status?: string
          target_entity_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_relationship: {
        Args: { p_relationship_id: string }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_entity: {
        Args: { p_entity_id: string }
        Returns: {
          confidence: string
          created_at: string
          description: string | null
          id: string
          name: string
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "entities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_memory: {
        Args: { p_memory_id: string }
        Returns: {
          confidence: string
          content: string
          created_at: string
          entity_id: string | null
          id: string
          observation_id: string | null
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "memories"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_relationship: {
        Args: { p_relationship_id: string }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      correct_entity: {
        Args: { p_description: string; p_entity_id: string }
        Returns: {
          confidence: string
          created_at: string
          description: string | null
          id: string
          name: string
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "entities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      correct_memory: {
        Args: { p_content: string; p_memory_id: string }
        Returns: {
          confidence: string
          content: string
          created_at: string
          entity_id: string | null
          id: string
          observation_id: string | null
          sensitivity: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "memories"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      correct_relationship: {
        Args: {
          p_date_precision?: string
          p_end_date?: string
          p_reason?: string
          p_relationship_id: string
          p_relationship_type: string
          p_source_entity_id: string
          p_start_date?: string
          p_target_entity_id: string
        }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_focused_graph: {
        Args: {
          p_cursor?: string
          p_depth?: number
          p_focus_entity_id: string
          p_include_historical?: boolean
          p_include_suggestions?: boolean
          p_limit?: number
        }
        Returns: Json
      }
      get_relationship_detail: {
        Args: {
          p_evidence_cursor?: string
          p_history_cursor?: string
          p_limit?: number
          p_relationship_id: string
        }
        Returns: Json
      }
      get_relationship_review_queue: {
        Args: { p_cursor?: string; p_filter?: string; p_limit?: number }
        Returns: Json
      }
      ingest_relationship_candidate: {
        Args: {
          p_date_precision?: string
          p_end_date?: string
          p_explanation?: string
          p_explicitness: string
          p_observation_ids: string[]
          p_relation_to_claim?: string
          p_relationship_type: string
          p_sensitivity?: string
          p_source_entity_id: string
          p_start_date?: string
          p_target_entity_id: string
          p_user_id: string
        }
        Returns: Json
      }
      mark_relationship_outdated: {
        Args: {
          p_date_precision?: string
          p_end_date?: string
          p_relationship_id: string
        }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_relationship: {
        Args: { p_reason?: string; p_relationship_id: string }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      restore_relationship: {
        Args: { p_relationship_id: string }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_relationship_visibility: {
        Args: { p_is_visible: boolean; p_relationship_id: string }
        Returns: {
          archived_at: string | null
          candidate_fingerprint: string
          confidence: string
          created_at: string
          created_by: string
          date_precision: string
          end_date: string | null
          evidence_set_hash: string | null
          explanation: string | null
          first_observed_at: string | null
          id: string
          is_directional: boolean
          is_visible: boolean
          last_confirmed_at: string | null
          last_observed_at: string | null
          relationship_type: string
          sensitivity: string
          source_entity_id: string
          start_date: string | null
          status: string
          target_entity_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "relationships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
