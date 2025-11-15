/**
 * PICARD Comprehensive Test Suite
 * End-to-end, integration, performance, stability, usability
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { PicardDB } from "../src/db";
import { MessageBroker } from "../src/message-broker";
import { execSync } from "node:child_process";

describe("END-TO-END: Complete User Journey", () => {
	test("User can check status without blocking terminal", () => {
		const result = execSync("picard", { encoding: "utf-8", timeout: 2000 });

		expect(result).toContain("PICARD");
		expect(result).toContain("Overview");
		// Should return, not hang
	});

	test("User can create task and see it immediately", () => {
		const createResult = execSync(
			'picard task create -t "test" -n "Test feature" -p medium',
			{ encoding: "utf-8" },
		);

		expect(createResult).toContain("Task created");

		const listResult = execSync("picard task list", { encoding: "utf-8" });
		expect(listResult).toContain("Test feature");
	});

	test("User can list projects", () => {
		const result = execSync("picard project list", { encoding: "utf-8" });
		expect(result).toContain("Projects");
	});
});

describe("PERFORMANCE: Response Times", () => {
	test("Status command completes in <500ms", () => {
		const start = performance.now();
		execSync("picard", { encoding: "utf-8" });
		const duration = performance.now() - start;

		expect(duration).toBeLessThan(500);
	});

	test("Database queries are fast (<100ms)", () => {
		const db = new PicardDB();

		const start = performance.now();
		db.getActiveAgents();
		db.getProjects();
		db.getActiveTasks();
		db.getROIMetrics();
		const duration = performance.now() - start;

		expect(duration).toBeLessThan(100);

		db.close();
	});
});

describe("STABILITY: Error Handling", () => {
	test("Handles missing database gracefully", () => {
		// Should create database if missing, not crash
		const db = new PicardDB();
		expect(db).toBeDefined();
		db.close();
	});

	test("Handles empty database gracefully", () => {
		const db = new PicardDB();

		expect(() => db.getActiveAgents()).not.toThrow();
		expect(() => db.getProjects()).not.toThrow();
		expect(() => db.getROIMetrics()).not.toThrow();

		db.close();
	});

	test("Handles concurrent access", async () => {
		const db1 = new PicardDB();
		const db2 = new PicardDB();

		const [result1, result2] = await Promise.all([
			Promise.resolve(db1.getProjects()),
			Promise.resolve(db2.getProjects()),
		]);

		expect(result1).toEqual(result2);

		db1.close();
		db2.close();
	});
});

describe("USABILITY: Core Workflows", () => {
	test("PM-Dev-QA workflow can be initiated", async () => {
		const { PMDevQAWorkflow } = await import("../src/workflows/pm-dev-qa.js");

		const workflow = new PMDevQAWorkflow({
			project_id: "test-usability",
			pm_agent_id: "pm",
			dev_agent_id: "dev",
			qa_agent_id: "qa",
		});

		const taskId = await workflow.pmCreateSpec("Feature", "Build feature");
		expect(taskId).toMatch(/^task_/);
	});

	test("Message broker facilitates agent communication", async () => {
		const broker = new MessageBroker();

		const messageId = await broker.sendMessage("agent-a", "agent-b", "command", {
			action: "test",
		});

		expect(messageId).toMatch(/^msg_/);

		const messages = broker.getPendingMessages("agent-b");
		expect(messages.length).toBeGreaterThan(0);

		broker.close();
	});
});

describe("FEATURE PARITY: PSA vs PICARD", () => {
	test("PSA feature: Non-blocking status", () => {
		// Should return immediately, not block
		const start = Date.now();
		execSync("picard", { encoding: "utf-8" });
		const duration = Date.now() - start;

		expect(duration).toBeLessThan(1000);
	});

	test("PSA feature: Project tracking in database", () => {
		const db = new PicardDB();
		const projects = db.getProjects();

		expect(Array.isArray(projects)).toBe(true);
		// Should have at least lovable_trae
		expect(projects.length).toBeGreaterThan(0);

		db.close();
	});

	test("PSA feature: Harvest command exists", () => {
		const result = execSync("picard harvest", { encoding: "utf-8" });
		expect(result).toContain("Harvesting insights");
	});

	test("PSA feature: Goto command exists", () => {
		const result = execSync("picard goto 0", { encoding: "utf-8" });
		expect(result).toContain("cd");
	});
});

describe("CODE QUALITY: Best Practices", () => {
	test("All database queries use parameterized statements", async () => {
		const dbFile = await Bun.file("src/db.ts").text();

		// Should not have string interpolation in SQL
		expect(dbFile).not.toContain('prepare(`INSERT INTO ${');
		expect(dbFile).not.toContain('prepare(`SELECT * FROM ${');
	});

	test("No shell injection vulnerabilities", async () => {
		const cliFile = await Bun.file("src/picard-simple.ts").text();

		// Should use spawn with array args, not execSync with interpolation
		const hasExecSyncWithTemplate = cliFile.match(/execSync\(`[^`]*\${/);
		expect(hasExecSyncWithTemplate).toBeNull();
	});

	test("Input validation is applied", async () => {
		const cliFile = await Bun.file("src/picard-simple.ts").text();

		// Should have validation calls
		expect(cliFile).toContain("validateAgentId");
		expect(cliFile).toContain("validatePath");
		expect(cliFile).toContain("validateTaskName");
	});
});

describe("REGRESSION: Previous Bugs Fixed", () => {
	test("Database permissions are secure (600)", async () => {
		const { stat } = await import("node:fs/promises");
		const dbPath = `${process.env.HOME}/.dev/logs/observability.db`;

		const stats = await stat(dbPath);
		const mode = (stats.mode & 0o777).toString(8);

		expect(mode).toBe("600");
	});

	test("No test data in production database", () => {
		const db = new PicardDB();

		const tasks = db.getActiveTasks();
		for (const task of tasks) {
			expect(task.task_name).not.toContain("DROP TABLE");
			expect(task.task_name).not.toContain("test-agent");
		}

		db.close();
	});
});
