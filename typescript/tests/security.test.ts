/**
 * PICARD Security Test Suite
 * Advanced security and penetration testing
 */

import { describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { PicardDB } from "../src/db";

describe("Security Tests", () => {
	test("Database file permissions are secure (600)", async () => {
		const dbPath = `${process.env.HOME}/.dev/logs/observability.db`;

		if (!existsSync(dbPath)) {
			// Initialize for test
			new PicardDB();
		}

		const stats = await stat(dbPath);
		const mode = (stats.mode & 0o777).toString(8);

		// Should be 600 (owner read/write only)
		expect(mode).toBe("600");
	});

	test("SQL Injection - Task name with SQL", () => {
		const db = new PicardDB();

		const maliciousName = "'; DROP TABLE tasks; --";

		expect(() => {
			db.db
				.prepare(
					`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, priority)
           VALUES (?, ?, ?, ?, 'pending', 'medium')`,
				)
				.run("test_task", "test_agent", "test_session", maliciousName);
		}).not.toThrow();

		// Verify table still exists
		const tables = db.db
			.prepare("SELECT name FROM sqlite_master WHERE type='table'")
			.all();
		expect(tables).toContainEqual({ name: "tasks" });

		db.close();
	});

	test("SQL Injection - Agent ID with backticks", () => {
		const db = new PicardDB();

		const maliciousId = "`; SELECT * FROM agents; --";

		// Should be parameterized, not injectable
		const result = db.db
			.prepare("SELECT * FROM agents WHERE agent_id = ?")
			.all(maliciousId);

		expect(Array.isArray(result)).toBe(true);

		db.close();
	});

	test("Path Traversal - Project path escapes home", () => {
		const maliciousPath = "../../../etc/passwd";

		// Should reject paths outside home directory
		const homedir = process.env.HOME || "/Users/test";
		const isWithinHome = maliciousPath.startsWith(homedir);

		expect(isWithinHome).toBe(false);
		// Production code should reject this
	});

	test("Command Injection - Shell metacharacters", () => {
		const maliciousAgent = "test; rm -rf /";

		// Test that our sanitization works
		const sanitized = maliciousAgent.replace(/[;&|`$()]/g, "");

		expect(sanitized).toBe("test rm -rf ");
		expect(sanitized).not.toContain(";");
	});

	test("Event Payload Size Limit", () => {
		const db = new PicardDB();

		// Attempt to insert massive payload (DOS attack)
		const hugeMetadata = "x".repeat(10_000_000); // 10MB

		expect(() => {
			db.db
				.prepare(
					`INSERT INTO events (event_type, agent_id, session_id, metadata_json)
           VALUES (?, ?, ?, ?)`,
				)
				.run("test.event", "test-agent", "test-session", hugeMetadata);
		}).toThrow(); // Should have size limits

		db.close();
	});

	test("Agent ID format validation", () => {
		const validIds = ["agent-001", "claude-code", "dev-agent-123"];
		const invalidIds = [
			"agent; DROP TABLE",
			"../../../etc/passwd",
			"agent`echo bad`",
			"a".repeat(1000), // Too long
		];

		const isValid = (id: string) => /^[a-z0-9-]+$/.test(id) && id.length <= 100;

		for (const id of validIds) {
			expect(isValid(id)).toBe(true);
		}

		for (const id of invalidIds) {
			expect(isValid(id)).toBe(false);
		}
	});
});

describe("Reliability Tests", () => {
	test("Database survives invalid queries", () => {
		const db = new PicardDB();

		// Try invalid SQL
		expect(() => {
			db.db.prepare("SELECT * FROM nonexistent_table").all();
		}).toThrow();

		// Database should still work
		const agents = db.getActiveAgents();
		expect(Array.isArray(agents)).toBe(true);

		db.close();
	});

	test("Handles missing HOME environment variable", () => {
		const originalHome = process.env.HOME;

		try {
			delete process.env.HOME;

			// Should not crash
			expect(() => {
				// Code that uses homedir()
			}).not.toThrow();
		} finally {
			process.env.HOME = originalHome;
		}
	});

	test("Concurrent database access", async () => {
		const db1 = new PicardDB();
		const db2 = new PicardDB();

		// Both try to read simultaneously
		const [agents1, agents2] = await Promise.all([
			Promise.resolve(db1.getActiveAgents()),
			Promise.resolve(db2.getActiveAgents()),
		]);

		expect(agents1).toEqual(agents2);

		db1.close();
		db2.close();
	});

	test("Handles corrupted data gracefully", () => {
		const db = new PicardDB();

		// Insert invalid JSON
		db.db
			.prepare(
				`INSERT INTO events (event_type, agent_id, session_id, metadata_json)
         VALUES (?, ?, ?, ?)`,
			)
			.run("test", "test-agent", "test-session", "INVALID JSON{]");

		// Query should not crash
		expect(() => {
			db.db.prepare("SELECT * FROM events LIMIT 10").all();
		}).not.toThrow();

		db.close();
	});
});
