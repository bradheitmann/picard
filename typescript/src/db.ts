/**
 * PICARD Database Interface
 * Using Bun's built-in SQLite (faster and native!)
 */

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
	Agent,
	ContextUsage,
	Event,
	Hack,
	Loadout,
	Project,
	Protocol,
	QualityGates,
	ROIMetrics,
	Task,
	TeamPerformance,
} from "./types";
import { validatePayloadSize } from "./security/validation.js";

const DB_PATH = join(homedir(), ".dev/logs/observability.db");

interface ROIQueryResult {
	tasks_completed: number | null;
	total_tokens: number | null;
	total_cost: number | null;
	total_lines: number | null;
	total_files: number | null;
}

interface RateResult {
	rate: number | null;
}

export class PicardDB {
	public db: Database; // Public for CLI access

	constructor(dbPath: string = DB_PATH) {
		this.db = new Database(dbPath);

		// SECURITY: Fix database file permissions (owner only)
		if (process.platform !== "win32") {
			try {
				const fs = require("node:fs");
				fs.chmodSync(dbPath, 0o600); // rw------- (owner only)
			} catch {
				// Ignore permission errors
			}
		}
	}

	// Get active agents
	getActiveAgents(): Agent[] {
		return this.db
			.prepare(
				`
      SELECT
        a.agent_id,
        a.agent_name,
        a.platform,
        a.agent_type,
        a.status,
        COUNT(DISTINCT t.task_id) as active_tasks,
        a.total_tasks_completed,
        a.total_tasks_failed
      FROM agents a
      LEFT JOIN tasks t ON a.agent_id = t.agent_id
        AND t.status IN ('claimed', 'in_progress')
      WHERE a.status IN ('active', 'idle', 'busy')
      GROUP BY a.agent_id
      ORDER BY a.agent_type, a.status DESC
    `,
			)
			.all() as Agent[];
	}

	// Get ROI metrics
	getROIMetrics(): ROIMetrics {
		const result = this.db
			.prepare(
				`
      SELECT
        COUNT(DISTINCT t.task_id) as tasks_completed,
        SUM(tu.total_tokens) as total_tokens,
        SUM(tu.cost_usd) as total_cost,
        SUM(t.lines_added) as total_lines,
        SUM(t.files_modified) as total_files
      FROM tasks t
      LEFT JOIN token_usage tu ON t.task_id = tu.task_id
      WHERE DATE(t.completed_at) = DATE('now')
        AND t.outcome = 'success'
    `,
			)
			.get() as ROIQueryResult | undefined;

		return {
			tasks_completed: result?.tasks_completed ?? 0,
			total_tokens: result?.total_tokens ?? 0,
			total_cost: result?.total_cost ?? 0,
			lines_delivered: result?.total_lines ?? 0,
			files_delivered: result?.total_files ?? 0,
			cost_per_task:
				result?.tasks_completed && result?.total_cost
					? result.total_cost / result.tasks_completed
					: 0,
			lines_per_dollar:
				result?.total_cost && result?.total_lines
					? result.total_lines / result.total_cost
					: 0,
		};
	}

	// Get quality gates status
	getQualityGates(): QualityGates {
		const successRate = this.db
			.prepare(
				`
      SELECT
        CAST(SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as rate
      FROM tasks
      WHERE completed_at > datetime('now', '-1 hour')
    `,
			)
			.get() as RateResult | undefined;

		const errorRate = this.db
			.prepare(
				`
      SELECT
        CAST(COUNT(CASE WHEN event_type LIKE '%.failed' THEN 1 END) AS FLOAT) / COUNT(*) as rate
      FROM events
      WHERE timestamp > datetime('now', '-1 hour')
    `,
			)
			.get() as RateResult | undefined;

		const success = successRate?.rate || 0;
		const error = errorRate?.rate || 0;

		return {
			success_rate: success,
			error_rate: error,
			quality_passing: success > 0.8 && error < 0.15,
		};
	}

	// Get recent events
	getRecentEvents(limit: number = 10): Event[] {
		return this.db
			.prepare(
				`
      SELECT timestamp, agent_id, event_type, project
      FROM events
      ORDER BY id DESC
      LIMIT ?
    `,
			)
			.all(limit) as Event[];
	}

	// Get active tasks
	getActiveTasks(): Task[] {
		return this.db
			.prepare(
				`
      SELECT task_id, task_name, agent_id, status, priority
      FROM tasks
      WHERE status IN ('pending', 'claimed', 'in_progress')
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END
      LIMIT 10
    `,
			)
			.all() as Task[];
	}

	// Get context usage
	getContextUsage(): ContextUsage[] {
		return this.db
			.prepare(
				`
      SELECT agent_id, AVG(input_tokens) as avg_input,
             MAX(input_tokens) as max_input, context_window
      FROM token_usage
      WHERE datetime(timestamp) > datetime('now', '-1 hour')
      GROUP BY agent_id
      ORDER BY avg_input DESC
    `,
			)
			.all() as ContextUsage[];
	}

	// Get team performance
	getTeamPerformance(): TeamPerformance[] {
		return this.db
			.prepare(
				`
      SELECT t.team_id, COUNT(DISTINCT ts.agent_id) as team_size,
             COUNT(DISTINCT ts.task_id) as tasks_completed,
             AVG(ts.duration_ms) / 1000.0 as avg_task_time_sec
      FROM teams t
      LEFT JOIN tasks ts ON t.team_id = ts.team_id
      WHERE ts.completed_at > datetime('now', '-24 hours') AND ts.outcome = 'success'
      GROUP BY t.team_id
    `,
			)
			.all() as TeamPerformance[];
	}

	// Get all projects
	getProjects(): Project[] {
		return this.db
			.prepare(`SELECT * FROM v_project_dashboard ORDER BY last_activity DESC`)
			.all() as Project[];
	}

	// Get all loadouts
	getLoadouts(): Loadout[] {
		return this.db
			.prepare(`SELECT * FROM v_loadout_performance ORDER BY times_used DESC`)
			.all() as Loadout[];
	}

	// Get all protocols
	getProtocols(): Protocol[] {
		return this.db
			.prepare(
				`SELECT * FROM protocols WHERE status = 'active' ORDER BY times_applied DESC`,
			)
			.all() as Protocol[];
	}

	// Get all hacks
	getHacks(): Hack[] {
		return this.db
			.prepare(`SELECT * FROM hacks ORDER BY times_used DESC, category ASC`)
			.all() as Hack[];
	}

	close() {
		this.db.close();
	}
}
