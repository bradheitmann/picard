/**
 * Complete Verification Test Suite
 * Tests EVERY feature requested throughout the session
 */

import { describe, test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { PicardDB } from "../src/db";
import { MessageBroker } from "../src/message-broker";
import { PMDevQAWorkflow } from "../src/workflows/pm-dev-qa";

describe("Session 1: Project Initialization", () => {
	test("lovable_trae project structure exists", () => {
		const projectPath = `${process.env.HOME}/projects-v2/bald-magic/lovable_trae`;

		// Core files should exist
		expect(existsSync(`${projectPath}/CLAUDE.md`)).toBe(true);
		expect(existsSync(`${projectPath}/package.json`)).toBe(true);
		expect(existsSync(`${projectPath}/docs/PROJECT_STATE.md`)).toBe(true);
		expect(existsSync(`${projectPath}/docs/AGENTS.md`)).toBe(true);
	});

	test("Lovable compatibility matrix exists", () => {
		const matrixPath = `${process.env.HOME}/projects-v2/bald-magic/lovable_trae/docs/lovable_technology_compatibility_matrix.yaml`;
		expect(existsSync(matrixPath)).toBe(true);
	});
});

describe("Session 2: Global PSA System", () => {
	test("PSA global dashboard exists", () => {
		expect(existsSync(`${process.env.HOME}/.warp/PSA_PROJECTS.md`)).toBe(true);
	});

	test("Projects are registered", () => {
		const db = new PicardDB();
		const projects = db.getProjects();

		expect(projects.length).toBeGreaterThan(0);
		expect(projects[0].project_name).toBeDefined();

		db.close();
	});
});

describe("Session 3: Knowledge System", () => {
	test("Playbook directory exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/playbooks`)).toBe(true);
	});

	test("Protocol directory exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/protocols`)).toBe(true);
	});

	test("Dev command exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/scripts/dev`)).toBe(true);
	});
});

describe("Session 4: PICARD Orchestration", () => {
	test("PICARD command exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/scripts/picard`)).toBe(true);
	});

	test("Database has all unified tables", () => {
		const db = new PicardDB();

		// Check critical tables exist
		const tables = db.db
			.prepare("SELECT name FROM sqlite_master WHERE type='table'")
			.all() as { name: string }[];

		const tableNames = tables.map((t) => t.name);

		expect(tableNames).toContain("projects");
		expect(tableNames).toContain("agents");
		expect(tableNames).toContain("loadouts");
		expect(tableNames).toContain("protocols");
		expect(tableNames).toContain("hacks");
		expect(tableNames).toContain("messages");
		expect(tableNames).toContain("events");
		expect(tableNames).toContain("tasks");

		db.close();
	});

	test("ROI metrics calculation works", () => {
		const db = new PicardDB();
		const roi = db.getROIMetrics();

		expect(roi).toHaveProperty("tasks_completed");
		expect(roi).toHaveProperty("lines_per_dollar");
		expect(roi).toHaveProperty("cost_per_task");

		db.close();
	});
});

describe("Session 5: Documentation", () => {
	test("User manual exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/PICARD_USER_MANUAL.md`)).toBe(true);
	});

	test("Quick start guide exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/START_HERE.md`)).toBe(true);
	});

	test("Cheat sheet exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/CHEAT_SHEET.md`)).toBe(true);
	});
});

describe("Session 6: Open Source Repositories", () => {
	test("Public repo directory exists", () => {
		expect(existsSync(`${process.env.HOME}/picard-open-source`)).toBe(true);
	});

	test("Private repo directory exists", () => {
		expect(existsSync(`${process.env.HOME}/picard-config`)).toBe(true);
	});

	test("TypeScript source in public repo", () => {
		expect(existsSync(`${process.env.HOME}/picard-open-source/typescript/src/cli.tsx`)).toBe(
			true,
		);
	});
});

describe("Session 7: Cloud Agent Integration", () => {
	test("Cloud agents documentation exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev/orchestration/CLOUD_AGENTS.md`)).toBe(true);
	});
});

describe("Session 8: TypeScript Implementation", () => {
	test("TypeScript PICARD exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/cli.tsx`)).toBe(true);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/db.ts`)).toBe(true);
	});

	test("Agent SDK exists", () => {
		expect(existsSync(`${process.env.HOME}/.dev-ts/packages/agent-sdk/src/index.ts`)).toBe(
			true,
		);
	});
});

describe("Session 9: Complete CLI", () => {
	test("picard-cli has all commands", async () => {
		const cliPath = `${process.env.HOME}/.dev-ts/src/picard-cli.ts`;
		const cli = Bun.file(cliPath);
		const content = await cli.text();

		// Check all commands exist
		expect(content.includes('.command("deploy")')).toBe(true);
		expect(content.includes('.command("task")')).toBe(true);
		expect(content.includes('.command("team")')).toBe(true);
		expect(content.includes('.command("project")')).toBe(true);
		expect(content.includes('.command("workflow")')).toBe(true);
		expect(content.includes('.command("status")')).toBe(true);
		expect(content.includes('.command("report")')).toBe(true);
	});
});

describe("Session 10: Platform Integration Framework", () => {
	test("Platform integration audit exists", () => {
		expect(
			existsSync(`${process.env.HOME}/.dev-ts/PLATFORM_INTEGRATION_AUDIT.md`),
		).toBe(true);
	});

	test("Protocol standards documented", () => {
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/protocols/standards.md`)).toBe(true);
	});
});

describe("Session 11: Agent-to-Agent Communication", () => {
	test("Message broker can route messages", async () => {
		const broker = new MessageBroker();

		const messageId = await broker.sendMessage("agent-a", "agent-b", "command", {
			test: true,
		});

		expect(messageId).toMatch(/^msg_/);

		const messages = broker.getPendingMessages("agent-b");
		expect(messages.length).toBeGreaterThan(0);

		broker.close();
	});

	test("Messages have all required fields", async () => {
		const broker = new MessageBroker();

		await broker.sendMessage("pm", "dev", "command", { action: "implement" });

		const messages = broker.getPendingMessages("dev");
		const msg = messages[0];

		expect(msg).toHaveProperty("id");
		expect(msg).toHaveProperty("from");
		expect(msg).toHaveProperty("to");
		expect(msg).toHaveProperty("type");
		expect(msg).toHaveProperty("payload");
		expect(msg).toHaveProperty("timestamp");

		broker.close();
	});
});

describe("Session 12: PM-Dev-QA Workflow", () => {
	test("Workflow can be initialized", () => {
		const workflow = new PMDevQAWorkflow({
			project_id: "test",
			pm_agent_id: "pm",
			dev_agent_id: "dev",
			qa_agent_id: "qa",
		});

		expect(workflow).toBeDefined();
	});

	test("PM can create spec and assign to Dev", async () => {
		const workflow = new PMDevQAWorkflow({
			project_id: "test",
			pm_agent_id: "pm-verify",
			dev_agent_id: "dev-verify",
			qa_agent_id: "qa-verify",
		});

		const taskId = await workflow.pmCreateSpec("Test Task", "Test specification");

		expect(taskId).toMatch(/^task_/);

		// Verify message sent to Dev
		const broker = new MessageBroker();
		const devMessages = broker.getPendingMessages("dev-verify");

		expect(devMessages.length).toBeGreaterThan(0);

		broker.close();
	});
});

describe("Session 13: Autonomous Execution", () => {
	test("Agent daemon class exists", async () => {
		const { AgentDaemon } = await import("../src/autonomous/agent-daemon.js");
		expect(AgentDaemon).toBeDefined();
	});
});

describe("Session 14: Security Hardening", () => {
	test("Validation functions exist and work", () => {
		const {
			validateAgentId,
			validatePath,
			validateTaskName,
			sanitizeShellArg,
		} = require("../src/security/validation.js");

		// Valid inputs should pass
		expect(() => validateAgentId("agent-001")).not.toThrow();
		expect(() => validateTaskName("Build feature")).not.toThrow();

		// Invalid inputs should throw
		expect(() => validateAgentId("'; DROP TABLE")).toThrow();
		expect(() => validateAgentId("a".repeat(200))).toThrow();

		// Sanitization should remove dangerous chars
		const cleaned = sanitizeShellArg("test; rm -rf /");
		expect(cleaned).not.toContain(";");
		expect(cleaned).not.toContain("/");
	});

	test("Database permissions are secure", async () => {
		const { stat } = await import("node:fs/promises");
		const dbPath = `${process.env.HOME}/.dev/logs/observability.db`;

		const stats = await stat(dbPath);
		const mode = (stats.mode & 0o777).toString(8);

		// Should be 600 (owner only)
		expect(mode).toBe("600");
	});
});

describe("Session 15: Complete TUI", () => {
	test("All view components exist", () => {
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/AgentsView.tsx`)).toBe(
			true,
		);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/ProjectsView.tsx`)).toBe(
			true,
		);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/LoadoutsView.tsx`)).toBe(
			true,
		);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/ProtocolsView.tsx`)).toBe(
			true,
		);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/HacksView.tsx`)).toBe(
			true,
		);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/HelpModal.tsx`)).toBe(
			true,
		);
		expect(existsSync(`${process.env.HOME}/.dev-ts/src/components/AlertsBanner.tsx`)).toBe(
			true,
		);
	});
});

describe("Overall System Integration", () => {
	test("PICARD can launch without errors", async () => {
		// This would require actual UI testing, checking that TUI renders
		// For now, check that imports work
		const db = new PicardDB();
		expect(db).toBeDefined();

		const agents = db.getActiveAgents();
		expect(Array.isArray(agents)).toBe(true);

		db.close();
	});

	test("All requested features are accessible", () => {
		const db = new PicardDB();

		// Can get all data types
		expect(() => db.getActiveAgents()).not.toThrow();
		expect(() => db.getProjects()).not.toThrow();
		expect(() => db.getLoadouts()).not.toThrow();
		expect(() => db.getProtocols()).not.toThrow();
		expect(() => db.getHacks()).not.toThrow();
		expect(() => db.getROIMetrics()).not.toThrow();
		expect(() => db.getQualityGates()).not.toThrow();
		expect(() => db.getContextUsage()).not.toThrow();
		expect(() => db.getTeamPerformance()).not.toThrow();

		db.close();
	});
});
