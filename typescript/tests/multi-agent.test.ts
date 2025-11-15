/**
 * Multi-Agent Orchestration Tests
 * Advanced tests unique to PICARD's multi-agent capabilities
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { PicardDB } from "../src/db";
import { MessageBroker } from "../src/message-broker";
import { PMDevQAWorkflow } from "../src/workflows/pm-dev-qa";

describe("Multi-Agent Communication", () => {
	let broker: MessageBroker;

	beforeEach(() => {
		broker = new MessageBroker();
	});

	afterEach(() => {
		broker.close();
	});

	test("Agent can send message to another agent", async () => {
		const messageId = await broker.sendMessage(
			"agent-a",
			"agent-b",
			"command",
			{ action: "test" },
		);

		expect(messageId).toMatch(/^msg_/);

		// Agent B should receive message
		const messages = broker.getPendingMessages("agent-b");
		expect(messages.length).toBeGreaterThan(0);
		expect(messages[0].from).toBe("agent-a");
	});

	test("Message delivery tracking", async () => {
		const messageId = await broker.sendMessage("agent-a", "agent-b", "notification", {
			text: "Task complete",
		});

		// Initially pending
		const pending = broker.getPendingMessages("agent-b");
		expect(pending[0].status).toBe("pending");

		// Mark as delivered
		broker.markDelivered(messageId);

		// Should not appear in pending anymore
		const stillPending = broker.getPendingMessages("agent-b");
		expect(stillPending.length).toBe(0);
	});

	test("Multiple agents can communicate concurrently", async () => {
		// PM → Dev, PM → QA, Dev → QA
		await Promise.all([
			broker.sendMessage("pm", "dev", "command", { task: "implement" }),
			broker.sendMessage("pm", "qa", "notification", { info: "new spec" }),
			broker.sendMessage("dev", "qa", "command", { action: "test" }),
		]);

		const devMessages = broker.getPendingMessages("dev");
		const qaMessages = broker.getPendingMessages("qa");

		expect(devMessages.length).toBe(1);
		expect(qaMessages.length).toBe(2); // From PM and Dev
	});
});

describe("PM-Dev-QA Workflow", () => {
	let workflow: PMDevQAWorkflow;
	let db: PicardDB;

	beforeEach(() => {
		db = new PicardDB();
		workflow = new PMDevQAWorkflow({
			project_id: "test-project",
			pm_agent_id: "pm-test",
			dev_agent_id: "dev-test",
			qa_agent_id: "qa-test",
		});
	});

	afterEach(() => {
		db.close();
	});

	test("PM can create spec and assign to Dev", async () => {
		const taskId = await workflow.pmCreateSpec("Build auth", "Add login with email/password");

		expect(taskId).toMatch(/^task_/);

		// Task should be in database
		const task = db.db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId) as any;

		expect(task.task_name).toBe("Build auth");
		expect(task.status).toBe("spec_created");
		expect(task.agent_id).toBe("pm-test");
	});

	test("Dev implementation triggers QA notification", async () => {
		const taskId = await workflow.pmCreateSpec("Feature X", "Spec for X");

		await workflow.devImplementFeature(taskId, {
			files: ["src/feature.ts", "tests/feature.test.ts"],
		});

		// Task status should be updated
		const task = db.db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId) as any;

		expect(task.status).toBe("implemented");

		// QA should have message
		const broker = new MessageBroker();
		const qaMessages = broker.getPendingMessages("qa-test");

		expect(qaMessages.length).toBeGreaterThan(0);
		const qaMsg = qaMessages.find((m) => (m.payload as any).task_id === taskId);
		expect(qaMsg).toBeDefined();

		broker.close();
	});

	test("QA approval completes workflow", async () => {
		const taskId = await workflow.pmCreateSpec("Feature Y", "Spec");
		await workflow.devImplementFeature(taskId, { files: ["src/y.ts"] });

		await workflow.qaApproveImplementation(taskId, {
			tests_passed: 10,
			coverage: 85,
		});

		// Task should be completed
		const task = db.db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId) as any;

		expect(task.status).toBe("completed");
		expect(task.outcome).toBe("success");

		// PM should be notified
		const broker = new MessageBroker();
		const pmMessages = broker.getPendingMessages("pm-test");
		const notification = pmMessages.find((m) => (m.payload as any).status === "APPROVED");

		expect(notification).toBeDefined();

		broker.close();
	});

	test("QA rejection triggers rework loop (adversarial)", async () => {
		const taskId = await workflow.pmCreateSpec("Feature Z", "Spec");
		await workflow.devImplementFeature(taskId, { files: ["src/z.ts"] });

		await workflow.qaRejectImplementation(taskId, {
			failures: ["Tests failing", "Missing validation"],
			severity: "high",
		});

		// Task should need rework
		const task = db.db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId) as any;

		expect(task.status).toBe("rework_needed");

		// Dev should receive rejection message
		const broker = new MessageBroker();
		const devMessages = broker.getPendingMessages("dev-test");
		const rejection = devMessages.find((m) => (m.payload as any).action === "fix_issues");

		expect(rejection).toBeDefined();
		expect((rejection?.payload as any).severity).toBe("high");

		broker.close();
	});

	test("Workflow status tracking", async () => {
		const taskId = await workflow.pmCreateSpec("Feature", "Spec");

		const status = workflow.getWorkflowStatus(taskId);

		expect(status.task_id).toBe(taskId);
		expect(status.current_agent).toBe("pm-test");
		expect(status.status).toBe("spec_created");
	});
});

describe("Context Window Management", () => {
	let db: PicardDB;

	beforeEach(() => {
		db = new PicardDB();
	});

	afterEach(() => {
		db.close();
	});

	test("Context usage tracking", () => {
		// Insert token usage data
		db.db
			.prepare(
				`INSERT INTO token_usage (agent_id, session_id, input_tokens, output_tokens, total_tokens, context_window, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			)
			.run("test-agent", "test-session", 45000, 5000, 50000, 100000);

		const context = db.getContextUsage();

		expect(context.length).toBeGreaterThan(0);
		const agentContext = context.find((c) => c.agent_id === "test-agent");

		expect(agentContext).toBeDefined();
		expect(agentContext?.avg_input).toBe(45000);
	});

	test("Detects context overload (>70%)", () => {
		// High context usage
		db.db
			.prepare(
				`INSERT INTO token_usage (agent_id, session_id, input_tokens, context_window, timestamp)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			)
			.run("overloaded-agent", "sess", 85000, 100000);

		const context = db.getContextUsage();
		const overloaded = context.find((c) => c.agent_id === "overloaded-agent");

		const usagePct = overloaded?.context_window
			? (overloaded.avg_input / overloaded.context_window) * 100
			: 0;

		expect(usagePct).toBeGreaterThan(70);
	});
});

describe("Quality Gates", () => {
	let db: PicardDB;

	beforeEach(() => {
		db = new PicardDB();
	});

	afterEach(() => {
		db.close();
	});

	test("Quality gates detect high failure rate", () => {
		// Add failed tasks
		for (let i = 0; i < 3; i++) {
			db.db
				.prepare(
					`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, outcome, completed_at)
           VALUES (?, ?, ?, ?, 'completed', 'failure', CURRENT_TIMESTAMP)`,
				)
				.run(`fail-task-${i}`, "test-agent", "sess", `Task ${i}`);
		}

		// Add successful tasks
		for (let i = 0; i < 7; i++) {
			db.db
				.prepare(
					`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, outcome, completed_at)
           VALUES (?, ?, ?, ?, 'completed', 'success', CURRENT_TIMESTAMP)`,
				)
				.run(`success-task-${i}`, "test-agent", "sess", `Task ${i}`);
		}

		const gates = db.getQualityGates();

		// 70% success rate - should fail quality gates
		expect(gates.success_rate).toBeLessThan(0.8);
		expect(gates.quality_passing).toBe(false);
	});
});

describe("ROI Tracking", () => {
	let db: PicardDB;

	beforeEach(() => {
		db = new PicardDB();
	});

	afterEach(() => {
		db.close();
	});

	test("Calculates lines per dollar correctly", () => {
		// Add task with cost and output
		db.db
			.prepare(
				`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, outcome, lines_added, completed_at)
         VALUES (?, ?, ?, ?, 'completed', 'success', ?, datetime('now'))`,
			)
			.run("roi-task", "test-agent", "sess", "Feature", 1000);

		db.db
			.prepare(
				`INSERT INTO token_usage (agent_id, session_id, task_id, total_tokens, cost_usd, timestamp)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
			)
			.run("test-agent", "sess", "roi-task", 50000, 0.5);

		const roi = db.getROIMetrics();

		// 1000 lines / $0.50 = 2000 lines per dollar
		expect(roi.lines_per_dollar).toBeGreaterThan(1900); // Account for rounding
		expect(roi.cost_per_task).toBe(0.5);
	});
});
