#!/usr/bin/env bun

/**
 * PICARD Event Collection Server
 * TypeScript + Bun version (replaces Python)
 * Receives events from all agents and stores in SQLite
 */

import { existsSync } from "node:fs";
import { appendFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { PicardDB } from "./db";

const PORT = process.env.PICARD_PORT ? parseInt(process.env.PICARD_PORT) : 8765;
const EVENTS_LOG = join(homedir(), ".dev/logs/events/global-stream.jsonl");

interface PicardEvent {
	type: string;
	timestamp: string;
	agent_id: string;
	agent_name?: string;
	platform?: string;
	session_id: string;
	task_id?: string;
	project?: string;
	team_id?: string;
	metadata?: Record<string, unknown>;
}

class EventCollector {
	private db: PicardDB;

	constructor() {
		this.db = new PicardDB();
		console.log(`✓ Event Collection Server running on localhost:${PORT}`);
		console.log(`✓ Database: ${homedir()}/.dev/logs/observability.db`);
		console.log(`✓ JSONL Stream: ${EVENTS_LOG}`);
		console.log();
		console.log("Endpoints:");
		console.log(`  POST http://localhost:${PORT}/events      - Ingest events`);
		console.log(`  GET  http://localhost:${PORT}/health      - Health check`);
		console.log(`  GET  http://localhost:${PORT}/events      - Recent events`);
		console.log();
		console.log("Press Ctrl+C to stop");
	}

	async ingestEvent(event: PicardEvent): Promise<void> {
		// Append to JSONL file
		await appendFile(EVENTS_LOG, `${JSON.stringify(event)}\n`);

		// Insert into database
		this.db.db
			.prepare(
				`INSERT INTO events (event_type, timestamp, agent_id, agent_name, platform, session_id, task_id, project, team_id, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				event.type,
				event.timestamp,
				event.agent_id,
				event.agent_name || null,
				event.platform || null,
				event.session_id,
				event.task_id || null,
				event.project || null,
				event.team_id || null,
				JSON.stringify(event.metadata || {}),
			);

		// Update agent last_seen
		this.db.db
			.prepare(
				`INSERT INTO agents (agent_id, agent_name, platform, status, first_seen, last_seen)
         VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(agent_id) DO UPDATE SET
           last_seen = CURRENT_TIMESTAMP,
           total_events = total_events + 1`,
			)
			.run(
				event.agent_id,
				event.agent_name || event.agent_id,
				event.platform || "unknown",
			);

		// Handle specific event types
		if (event.type === "task.completed") {
			this.handleTaskCompleted(event);
		} else if (event.type === "task.failed") {
			this.handleTaskFailed(event);
		} else if (event.type.includes("token")) {
			this.handleTokenUsage(event);
		}
	}

	private handleTaskCompleted(event: PicardEvent): void {
		this.db.db
			.prepare(
				`UPDATE tasks
         SET status = 'completed', completed_at = ?, outcome = 'success'
         WHERE task_id = ?`,
			)
			.run(event.timestamp, event.task_id);

		this.db.db
			.prepare(
				`UPDATE agents SET total_tasks_completed = total_tasks_completed + 1 WHERE agent_id = ?`,
			)
			.run(event.agent_id);
	}

	private handleTaskFailed(event: PicardEvent): void {
		this.db.db
			.prepare(
				`UPDATE tasks
         SET status = 'failed', completed_at = ?, outcome = 'failure'
         WHERE task_id = ?`,
			)
			.run(event.timestamp, event.task_id);

		this.db.db
			.prepare(
				`UPDATE agents SET total_tasks_failed = total_tasks_failed + 1 WHERE agent_id = ?`,
			)
			.run(event.agent_id);
	}

	private handleTokenUsage(event: PicardEvent): void {
		const metadata = event.metadata || {};

		this.db.db
			.prepare(
				`INSERT INTO token_usage (timestamp, agent_id, session_id, task_id, model, input_tokens, output_tokens, total_tokens, cost_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				event.timestamp,
				event.agent_id,
				event.session_id,
				event.task_id || null,
				(metadata.model as string) || null,
				(metadata.input_tokens as number) || 0,
				(metadata.output_tokens as number) || 0,
				(metadata.total_tokens as number) || 0,
				(metadata.cost_usd as number) || 0,
			);
	}
}

// Create HTTP server with Bun
const collector = new EventCollector();

Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url);

		// Health check
		if (url.pathname === "/health") {
			return new Response(JSON.stringify({ status: "healthy" }), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// Ingest event
		if (url.pathname === "/events" && req.method === "POST") {
			try {
				const event = (await req.json()) as PicardEvent;
				await collector.ingestEvent(event);

				return new Response(JSON.stringify({ status: "ok" }), {
					headers: { "Content-Type": "application/json" },
				});
			} catch (error) {
				return new Response(
					JSON.stringify({
						status: "error",
						message: error instanceof Error ? error.message : String(error),
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// Get recent events
		if (url.pathname === "/events" && req.method === "GET") {
			const limit = parseInt(url.searchParams.get("limit") || "100");

			const events = collector.db.db
				.prepare(
					`SELECT event_type, timestamp, agent_id, project, metadata_json
           FROM events
           ORDER BY id DESC
           LIMIT ?`,
				)
				.all(limit);

			return new Response(JSON.stringify(events), {
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response("Not Found", { status: 404 });
	},
});

// Handle shutdown
process.on("SIGINT", () => {
	console.log("\n\n✓ Event collector stopped");
	process.exit(0);
});
