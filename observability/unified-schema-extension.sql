-- PICARD Unified Schema Extension
-- Adds Projects, Loadouts, Protocols, and Hacks to existing observability.db

-- Projects (from PSA)
CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  project_path TEXT NOT NULL UNIQUE,
  project_type TEXT,
  tech_stack TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  phase TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_agents INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,
  total_lines_delivered INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity);

-- Loadouts (agent configurations)
CREATE TABLE IF NOT EXISTS loadouts (
  loadout_id TEXT PRIMARY KEY,
  loadout_name TEXT NOT NULL,
  model TEXT NOT NULL,
  model_version TEXT,
  ide_platform TEXT,
  temperature REAL,
  mode TEXT,
  max_tokens INTEGER,
  tooling_json TEXT,
  constitution_path TEXT,
  skills_json TEXT,
  mcp_servers_json TEXT,
  subagents_json TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  times_used INTEGER DEFAULT 0,
  avg_cost_per_task REAL,
  avg_lines_per_dollar REAL
);

CREATE INDEX IF NOT EXISTS idx_loadouts_model ON loadouts(model);
CREATE INDEX IF NOT EXISTS idx_loadouts_platform ON loadouts(ide_platform);

-- Loadout Observations (anecdotes and learnings)
CREATE TABLE IF NOT EXISTS loadout_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loadout_id TEXT NOT NULL,
  project_id TEXT,
  observation_type TEXT NOT NULL,
  observation_text TEXT NOT NULL,
  category TEXT,
  sentiment TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loadout_id) REFERENCES loadouts(loadout_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE INDEX IF NOT EXISTS idx_observations_loadout ON loadout_observations(loadout_id);
CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON loadout_observations(timestamp);

-- Protocols (versioned development protocols)
CREATE TABLE IF NOT EXISTS protocols (
  protocol_id TEXT PRIMARY KEY,
  protocol_name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  content_path TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  times_applied INTEGER DEFAULT 0,
  success_rate REAL
);

CREATE INDEX IF NOT EXISTS idx_protocols_name ON protocols(protocol_name);
CREATE INDEX IF NOT EXISTS idx_protocols_status ON protocols(status);

-- Hacks (helpful shortcuts and commands)
CREATE TABLE IF NOT EXISTS hacks (
  hack_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  command TEXT NOT NULL,
  description TEXT,
  tags_json TEXT,
  platform TEXT,
  times_used INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hacks_category ON hacks(category);
CREATE INDEX IF NOT EXISTS idx_hacks_platform ON hacks(platform);

-- Project-Agent Assignments (many-to-many)
CREATE TABLE IF NOT EXISTS project_agents (
  project_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role TEXT,
  status TEXT DEFAULT 'active',
  PRIMARY KEY (project_id, agent_id),
  FOREIGN KEY (project_id) REFERENCES projects(project_id),
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Views for Unified Queries

-- Unified Project Dashboard
CREATE VIEW IF NOT EXISTS v_project_dashboard AS
SELECT
  p.project_id,
  p.project_name,
  p.project_path,
  p.status,
  p.phase,
  COUNT(DISTINCT pa.agent_id) as active_agents,
  p.total_tasks_completed,
  p.total_cost_usd,
  p.total_lines_delivered,
  CASE
    WHEN p.total_cost_usd > 0
    THEN p.total_lines_delivered / p.total_cost_usd
    ELSE 0
  END as lines_per_dollar,
  p.last_activity
FROM projects p
LEFT JOIN project_agents pa ON p.project_id = pa.project_id AND pa.status = 'active'
GROUP BY p.project_id;

-- Loadout Performance Comparison
CREATE VIEW IF NOT EXISTS v_loadout_performance AS
SELECT
  l.loadout_id,
  l.loadout_name,
  l.model,
  l.ide_platform,
  l.times_used,
  l.avg_cost_per_task,
  l.avg_lines_per_dollar,
  COUNT(DISTINCT lo.id) as total_observations,
  SUM(CASE WHEN lo.sentiment = 'positive' THEN 1 ELSE 0 END) as positive_observations,
  SUM(CASE WHEN lo.sentiment = 'negative' THEN 1 ELSE 0 END) as negative_observations
FROM loadouts l
LEFT JOIN loadout_observations lo ON l.loadout_id = lo.loadout_id
GROUP BY l.loadout_id;

-- Protocol Effectiveness
CREATE VIEW IF NOT EXISTS v_protocol_effectiveness AS
SELECT
  protocol_name,
  version,
  times_applied,
  success_rate,
  updated_at
FROM protocols
WHERE status = 'active'
ORDER BY times_applied DESC;
