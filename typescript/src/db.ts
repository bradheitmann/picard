/**
 * PICARD Database Interface
 * Using Bun's built-in SQLite (faster and native!)
 */

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Agent, Event, QualityGates, ROIMetrics, Task } from "./types";

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
	private db: Database;

	constructor(dbPath: string = DB_PATH) {
		this.db = new Database(dbPath);
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

	// Get all projects
	getProjects(): unknown[] {
		return this.db
			.prepare(`SELECT * FROM v_project_dashboard ORDER BY last_activity DESC`)
			.all();
	}

	// Get all loadouts
	getLoadouts(): unknown[] {
		return this.db
			.prepare(`SELECT * FROM v_loadout_performance ORDER BY times_used DESC`)
			.all();
	}

	close() {
		this.db.close();
	}
}
