-- Multi-Agent Observability Database Schema
-- SQLite database for agent event tracking, metrics, and health monitoring

-- Core Events Table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,                    -- e.g., "agent.started", "task.completed"
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  platform TEXT,                               -- claude-code, cursor, trae, etc.
  session_id TEXT NOT NULL,
  task_id TEXT,
  project TEXT,
  team_id TEXT,
  metadata_json TEXT,                          -- JSON blob for flexible data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_task ON events(task_id);
CREATE INDEX idx_events_team ON events(team_id);

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
  agent_id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  agent_type TEXT,                             -- assistant, specialist, coordinator
  constitution_path TEXT,
  version TEXT,
  status TEXT DEFAULT 'inactive',              -- active, inactive, error, unknown
  capabilities_json TEXT,                      -- JSON array of capabilities
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_events INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_failed INTEGER DEFAULT 0
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  project TEXT,
  team_id TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration_ms INTEGER,
  status TEXT DEFAULT 'active',                -- active, completed, failed, abandoned
  tasks_completed INTEGER DEFAULT 0,
  files_modified INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

CREATE INDEX idx_sessions_agent ON sessions(agent_id);
CREATE INDEX idx_sessions_started ON sessions(started_at);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  task_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  project TEXT,
  team_id TEXT,
  task_name TEXT NOT NULL,
  task_description TEXT,
  priority TEXT,                               -- low, medium, high, critical
  status TEXT DEFAULT 'pending',               -- pending, claimed, in_progress, completed, failed
  claimed_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INTEGER,
  outcome TEXT,                                -- success, failure, abandoned
  error_message TEXT,
  files_modified INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  tests_added INTEGER DEFAULT 0,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX idx_tasks_agent ON tasks(agent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_completed ON tasks(completed_at);

-- Tool Usage Table
CREATE TABLE IF NOT EXISTS tool_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  task_id TEXT,
  tool_name TEXT NOT NULL,                     -- Read, Write, Edit, Bash, Task, etc.
  tool_category TEXT,                          -- file, execution, agent, web, etc.
  invocation_count INTEGER DEFAULT 1,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  metadata_json TEXT,                          -- Tool-specific data
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX idx_tool_usage_agent ON tool_usage(agent_id);
CREATE INDEX idx_tool_usage_tool ON tool_usage(tool_name);
CREATE INDEX idx_tool_usage_timestamp ON tool_usage(timestamp);

-- Token Usage Table
CREATE TABLE IF NOT EXISTS token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  task_id TEXT,
  model TEXT,                                  -- claude-sonnet-4, gpt-4, etc.
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0.0,                   -- Estimated cost
  context_window INTEGER,                      -- Max context size
  cache_hit BOOLEAN DEFAULT 0,                 -- Prompt caching
  metadata_json TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX idx_token_usage_agent ON token_usage(agent_id);
CREATE INDEX idx_token_usage_model ON token_usage(model);
CREATE INDEX idx_token_usage_timestamp ON token_usage(timestamp);

-- Metrics Table
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT,
  team_id TEXT,
  project TEXT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,                            -- ratio, count, ms, bytes, etc.
  window_size_ms INTEGER,                      -- Time window for aggregation
  metadata_json TEXT
);

CREATE INDEX idx_metrics_name ON metrics(metric_name);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX idx_metrics_agent ON metrics(agent_id);

-- Agent Health Table
CREATE TABLE IF NOT EXISTS agent_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_id TEXT NOT NULL,
  health_status TEXT NOT NULL,                 -- healthy, degraded, error, offline
  health_score REAL,                           -- 0.0 to 1.0
  error_rate REAL,                             -- Errors / total actions
  avg_response_time_ms INTEGER,
  tasks_completed_last_hour INTEGER,
  tasks_failed_last_hour INTEGER,
  last_error TEXT,
  last_error_time DATETIME,
  anomaly_detected BOOLEAN DEFAULT 0,
  anomaly_description TEXT,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

CREATE INDEX idx_health_agent ON agent_health(agent_id);
CREATE INDEX idx_health_timestamp ON agent_health(timestamp);
CREATE INDEX idx_health_status ON agent_health(health_status);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  team_description TEXT,
  coordination_strategy TEXT,                  -- leader-followers, peer-to-peer, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT 1
);

-- Team Members Table (many-to-many)
CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  role TEXT,                                   -- lead, specialist, qa, etc.
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, agent_id),
  FOREIGN KEY (team_id) REFERENCES teams(team_id),
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Conflicts Table
CREATE TABLE IF NOT EXISTS conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  agent_a_id TEXT NOT NULL,
  agent_b_id TEXT NOT NULL,
  conflict_type TEXT NOT NULL,                 -- file_edit, task_duplicate, resource_lock
  resource_path TEXT,                          -- File path or resource identifier
  task_id TEXT,
  resolution_strategy TEXT,                    -- first_wins, manual, merge, defer
  resolved BOOLEAN DEFAULT 0,
  resolved_at DATETIME,
  resolution_notes TEXT,
  FOREIGN KEY (agent_a_id) REFERENCES agents(agent_id),
  FOREIGN KEY (agent_b_id) REFERENCES agents(agent_id)
);

CREATE INDEX idx_conflicts_resolved ON conflicts(resolved);
CREATE INDEX idx_conflicts_timestamp ON conflicts(timestamp);

-- Insights Table (harvested knowledge)
CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_project TEXT,
  source_agent TEXT,
  insight_type TEXT,                           -- adr, lesson_learned, best_practice, gotcha
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags_json TEXT,                              -- JSON array of tags
  confidence REAL DEFAULT 0.5,                 -- 0.0 to 1.0
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  applied_count INTEGER DEFAULT 0              -- How many times this insight was reused
);

CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_timestamp ON insights(timestamp);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  alert_type TEXT NOT NULL,                    -- agent_down, high_error_rate, token_limit, etc.
  severity TEXT NOT NULL,                      -- info, warning, error, critical
  agent_id TEXT,
  team_id TEXT,
  project TEXT,
  message TEXT NOT NULL,
  metadata_json TEXT,
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_at DATETIME,
  resolved BOOLEAN DEFAULT 0,
  resolved_at DATETIME
);

CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);

-- Views for Common Queries

-- Active Agents View
CREATE VIEW IF NOT EXISTS v_active_agents AS
SELECT
  a.agent_id,
  a.agent_name,
  a.platform,
  a.status,
  s.session_id,
  s.started_at,
  COUNT(DISTINCT t.task_id) as active_tasks,
  (SELECT COUNT(*) FROM events e WHERE e.agent_id = a.agent_id AND e.timestamp > datetime('now', '-5 minutes')) as recent_events
FROM agents a
LEFT JOIN sessions s ON a.agent_id = s.agent_id AND s.status = 'active'
LEFT JOIN tasks t ON s.session_id = t.session_id AND t.status IN ('claimed', 'in_progress')
WHERE a.status = 'active'
GROUP BY a.agent_id, a.agent_name, a.platform, a.status, s.session_id, s.started_at;

-- Agent Performance View
CREATE VIEW IF NOT EXISTS v_agent_performance AS
SELECT
  a.agent_id,
  a.agent_name,
  COUNT(DISTINCT t.task_id) as total_tasks,
  SUM(CASE WHEN t.outcome = 'success' THEN 1 ELSE 0 END) as successful_tasks,
  SUM(CASE WHEN t.outcome = 'failure' THEN 1 ELSE 0 END) as failed_tasks,
  ROUND(AVG(t.duration_ms), 2) as avg_task_duration_ms,
  SUM(t.files_modified) as total_files_modified,
  SUM(t.lines_added) as total_lines_added,
  SUM(tu.input_tokens) as total_input_tokens,
  SUM(tu.output_tokens) as total_output_tokens,
  ROUND(SUM(tu.cost_usd), 4) as total_cost_usd
FROM agents a
LEFT JOIN tasks t ON a.agent_id = t.agent_id
LEFT JOIN token_usage tu ON a.agent_id = tu.agent_id
GROUP BY a.agent_id, a.agent_name;

-- Tool Usage Summary View
CREATE VIEW IF NOT EXISTS v_tool_usage_summary AS
SELECT
  agent_id,
  tool_name,
  tool_category,
  COUNT(*) as usage_count,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_uses,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_uses,
  ROUND(AVG(duration_ms), 2) as avg_duration_ms
FROM tool_usage
GROUP BY agent_id, tool_name, tool_category;

-- Recent Errors View
CREATE VIEW IF NOT EXISTS v_recent_errors AS
SELECT
  e.timestamp,
  e.agent_id,
  e.event_type,
  e.task_id,
  json_extract(e.metadata_json, '$.error') as error_message,
  json_extract(e.metadata_json, '$.error_details') as error_details
FROM events e
WHERE e.event_type LIKE '%.failed' OR e.event_type LIKE '%.error'
ORDER BY e.timestamp DESC
LIMIT 100;
