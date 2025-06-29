/*
  # QFD Application Database Schema

  1. New Tables
    - `qfd_projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, references auth.users)
    
    - `customer_requirements`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references qfd_projects)
      - `description` (text)
      - `importance` (integer)
      - `competitor_ratings` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `technical_requirements`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references qfd_projects)
      - `description` (text)
      - `unit` (text)
      - `target` (text)
      - `difficulty` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `relationships`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references qfd_projects)
      - `customer_req_id` (uuid, references customer_requirements)
      - `technical_req_id` (uuid, references technical_requirements)
      - `strength` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `technical_correlations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references qfd_projects)
      - `tech_req1_id` (uuid, references technical_requirements)
      - `tech_req2_id` (uuid, references technical_requirements)
      - `correlation` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `project_settings`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references qfd_projects)
      - `competitor_names` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own projects
*/

-- Create QFD Projects table
CREATE TABLE IF NOT EXISTS qfd_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New QFD Project',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create Customer Requirements table
CREATE TABLE IF NOT EXISTS customer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qfd_projects(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  importance integer DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
  competitor_ratings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Technical Requirements table
CREATE TABLE IF NOT EXISTS technical_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qfd_projects(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  unit text DEFAULT '',
  target text DEFAULT '',
  difficulty integer DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qfd_projects(id) ON DELETE CASCADE,
  customer_req_id uuid REFERENCES customer_requirements(id) ON DELETE CASCADE,
  technical_req_id uuid REFERENCES technical_requirements(id) ON DELETE CASCADE,
  strength integer DEFAULT 0 CHECK (strength IN (0, 1, 3, 9)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_req_id, technical_req_id)
);

-- Create Technical Correlations table
CREATE TABLE IF NOT EXISTS technical_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qfd_projects(id) ON DELETE CASCADE,
  tech_req1_id uuid REFERENCES technical_requirements(id) ON DELETE CASCADE,
  tech_req2_id uuid REFERENCES technical_requirements(id) ON DELETE CASCADE,
  correlation integer DEFAULT 0 CHECK (correlation IN (-2, -1, 0, 1, 2)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tech_req1_id, tech_req2_id),
  CHECK (tech_req1_id != tech_req2_id)
);

-- Create Project Settings table
CREATE TABLE IF NOT EXISTS project_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES qfd_projects(id) ON DELETE CASCADE,
  competitor_names jsonb DEFAULT '["Competitor A", "Competitor B"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable Row Level Security
ALTER TABLE qfd_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for QFD Projects
CREATE POLICY "Users can view own projects"
  ON qfd_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON qfd_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON qfd_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON qfd_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS Policies for Customer Requirements
CREATE POLICY "Users can manage customer requirements in own projects"
  ON customer_requirements
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM qfd_projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for Technical Requirements
CREATE POLICY "Users can manage technical requirements in own projects"
  ON technical_requirements
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM qfd_projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for Relationships
CREATE POLICY "Users can manage relationships in own projects"
  ON relationships
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM qfd_projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for Technical Correlations
CREATE POLICY "Users can manage correlations in own projects"
  ON technical_correlations
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM qfd_projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for Project Settings
CREATE POLICY "Users can manage settings in own projects"
  ON project_settings
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM qfd_projects WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_requirements_project_id ON customer_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_technical_requirements_project_id ON technical_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_relationships_project_id ON relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_relationships_customer_req_id ON relationships(customer_req_id);
CREATE INDEX IF NOT EXISTS idx_relationships_technical_req_id ON relationships(technical_req_id);
CREATE INDEX IF NOT EXISTS idx_technical_correlations_project_id ON technical_correlations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_settings_project_id ON project_settings(project_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_qfd_projects_updated_at BEFORE UPDATE ON qfd_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_requirements_updated_at BEFORE UPDATE ON customer_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technical_requirements_updated_at BEFORE UPDATE ON technical_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technical_correlations_updated_at BEFORE UPDATE ON technical_correlations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_settings_updated_at BEFORE UPDATE ON project_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();