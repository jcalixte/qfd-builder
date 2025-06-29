export interface Database {
  public: {
    Tables: {
      qfd_projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      customer_requirements: {
        Row: {
          id: string;
          project_id: string;
          description: string;
          importance: number;
          competitor_ratings: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          description?: string;
          importance?: number;
          competitor_ratings?: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          description?: string;
          importance?: number;
          competitor_ratings?: number[];
          created_at?: string;
          updated_at?: string;
        };
      };
      technical_requirements: {
        Row: {
          id: string;
          project_id: string;
          description: string;
          unit: string;
          target: string;
          difficulty: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          description?: string;
          unit?: string;
          target?: string;
          difficulty?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          description?: string;
          unit?: string;
          target?: string;
          difficulty?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          project_id: string;
          customer_req_id: string;
          technical_req_id: string;
          strength: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          customer_req_id: string;
          technical_req_id: string;
          strength?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          customer_req_id?: string;
          technical_req_id?: string;
          strength?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      technical_correlations: {
        Row: {
          id: string;
          project_id: string;
          tech_req1_id: string;
          tech_req2_id: string;
          correlation: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          tech_req1_id: string;
          tech_req2_id: string;
          correlation?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          tech_req1_id?: string;
          tech_req2_id?: string;
          correlation?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_settings: {
        Row: {
          id: string;
          project_id: string;
          competitor_names: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          competitor_names?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          competitor_names?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}