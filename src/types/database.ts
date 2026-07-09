export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Confidence = "low" | "medium" | "high" | "confirmed";
export type Sensitivity = "normal" | "sensitive";
export type LifeOsStatus = "suggested" | "active" | "confirmed" | "hidden" | "archived" | "deleted";

export type Database = {
  public: {
    Tables: {
      captures: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          source: string;
          sensitivity: Sensitivity;
          status: LifeOsStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          source?: string;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          source?: string;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      observations: {
        Row: {
          id: string;
          user_id: string;
          capture_id: string | null;
          content: string;
          type: string;
          confidence: Confidence;
          sensitivity: Sensitivity;
          status: LifeOsStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          capture_id?: string | null;
          content: string;
          type?: string;
          confidence?: Confidence;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          capture_id?: string | null;
          content?: string;
          type?: string;
          confidence?: Confidence;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "observations_capture_id_fkey";
            columns: ["capture_id"];
            isOneToOne: false;
            referencedRelation: "captures";
            referencedColumns: ["id"];
          }
        ];
      };
      entities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          description: string | null;
          confidence: Confidence;
          sensitivity: Sensitivity;
          status: LifeOsStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          description?: string | null;
          confidence?: Confidence;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          confidence?: Confidence;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_duplicate_candidates: {
        Row: {
          id: string;
          user_id: string;
          entity_id: string | null;
          duplicate_entity_id: string;
          candidate_name: string | null;
          reason: string;
          confidence: Confidence;
          status: LifeOsStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_id?: string | null;
          duplicate_entity_id: string;
          candidate_name?: string | null;
          reason: string;
          confidence?: Confidence;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_id?: string | null;
          duplicate_entity_id?: string;
          candidate_name?: string | null;
          reason?: string;
          confidence?: Confidence;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entity_duplicate_candidates_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_duplicate_candidates_duplicate_entity_id_fkey";
            columns: ["duplicate_entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          }
        ];
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          entity_id: string | null;
          observation_id: string | null;
          content: string;
          type: string;
          confidence: Confidence;
          sensitivity: Sensitivity;
          status: LifeOsStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_id?: string | null;
          observation_id?: string | null;
          content: string;
          type?: string;
          confidence?: Confidence;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_id?: string | null;
          observation_id?: string | null;
          content?: string;
          type?: string;
          confidence?: Confidence;
          sensitivity?: Sensitivity;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memories_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memories_observation_id_fkey";
            columns: ["observation_id"];
            isOneToOne: false;
            referencedRelation: "observations";
            referencedColumns: ["id"];
          }
        ];
      };
      briefings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          status: LifeOsStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          status?: LifeOsStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
