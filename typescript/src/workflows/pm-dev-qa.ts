/**
 * PM-Dev-QA Workflow Automation
 * The essential three-agent development primitive
 */

import { PicardDB } from "../db.js";
import { MessageBroker } from "../message-broker.js";

interface WorkflowConfig {
	project_id: string;
	pm_agent_id: string;
	dev_agent_id: string;
	qa_agent_id: string;
}

export class PMDevQAWorkflow {
	private broker: MessageBroker;
	private db: PicardDB;
	private config: WorkflowConfig;

	constructor(config: WorkflowConfig) {
		this.config = config;
		this.broker = new MessageBroker();
		this.db = new PicardDB();
	}

	/**
	 * Step 1: PM creates specification
	 */
	async pmCreateSpec(taskName: string, specification: string): Promise<string> {
		// Create task in database
		const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		const sessionId = `sess_${Date.now()}`;

		this.db.db
			.prepare(
				`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, priority)
         VALUES (?, ?, ?, ?, 'spec_created', 'high')`,
			)
			.run(taskId, this.config.pm_agent_id, sessionId, taskName);

		// Send specification to Dev
		await this.broker.sendMessage(
			this.config.pm_agent_id,
			this.config.dev_agent_id,
			"command",
			{
				action: "implement_feature",
				task_id: taskId,
				specification,
				requirements: ["Unit tests required", "Type-safe", "Documentation"],
			},
		);

		console.log(`✓ PM created spec: ${taskName}`);
		console.log(`  Task ID: ${taskId}`);
		console.log(`  → Assigned to Dev: ${this.config.dev_agent_id}`);

		return taskId;
	}

	/**
	 * Step 2: Dev implements feature
	 */
	async devImplementFeature(
		taskId: string,
		implementation: { files: string[] },
	): Promise<void> {
		// Update task status
		this.db.db
			.prepare(`UPDATE tasks SET status = 'implemented' WHERE task_id = ?`)
			.run(taskId);

		// Send implementation to QA
		await this.broker.sendMessage(
			this.config.dev_agent_id,
			this.config.qa_agent_id,
			"command",
			{
				action: "test_implementation",
				task_id: taskId,
				files_changed: implementation.files,
				tests_location: "tests/",
				coverage_required: 80,
			},
		);

		console.log(`✓ Dev completed implementation`);
		console.log(`  Files: ${implementation.files.join(", ")}`);
		console.log(`  → Sent to QA: ${this.config.qa_agent_id}`);
	}

	/**
	 * Step 3a: QA tests and PASSES
	 */
	async qaApproveImplementation(
		taskId: string,
		testResults: {
			tests_passed: number;
			coverage: number;
		},
	): Promise<void> {
		// Update task status
		this.db.db
			.prepare(
				`UPDATE tasks SET status = 'completed', outcome = 'success' WHERE task_id = ?`,
			)
			.run(taskId);

		// Notify PM of completion
		await this.broker.sendMessage(
			this.config.qa_agent_id,
			this.config.pm_agent_id,
			"notification",
			{
				action: "task_completed",
				task_id: taskId,
				test_results: testResults,
				status: "APPROVED",
			},
		);

		console.log(`✓ QA approved implementation`);
		console.log(`  Tests: ${testResults.tests_passed} passed`);
		console.log(`  Coverage: ${testResults.coverage}%`);
		console.log(`  → Notified PM: ${this.config.pm_agent_id}`);
	}

	/**
	 * Step 3b: QA finds issues - ADVERSARIAL
	 */
	async qaRejectImplementation(
		taskId: string,
		issues: {
			failures: string[];
			severity: "low" | "medium" | "high" | "critical";
		},
	): Promise<void> {
		// Update task status to rework needed
		this.db.db
			.prepare(`UPDATE tasks SET status = 'rework_needed' WHERE task_id = ?`)
			.run(taskId);

		// Send issues back to Dev (adversarial feedback)
		await this.broker.sendMessage(
			this.config.qa_agent_id,
			this.config.dev_agent_id,
			"command",
			{
				action: "fix_issues",
				task_id: taskId,
				failures: issues.failures,
				severity: issues.severity,
				requirements: [
					"All tests must pass",
					"Fix bugs",
					"Re-submit for testing",
				],
			},
		);

		console.log(`❌ QA rejected implementation`);
		console.log(`  Issues: ${issues.failures.length}`);
		console.log(`  Severity: ${issues.severity}`);
		console.log(`  → Sent back to Dev: ${this.config.dev_agent_id}`);
		console.log(`  (Adversarial loop active)`);
	}

	/**
	 * Get workflow status
	 */
	getWorkflowStatus(taskId: string): {
		task_id: string;
		current_agent: string;
		status: string;
		loop_count: number;
	} {
		const task = this.db.db
			.prepare(`SELECT * FROM tasks WHERE task_id = ?`)
			.get(taskId) as any;

		// Count rework loops
		const messages = this.db.db
			.prepare(
				`SELECT COUNT(*) as count FROM messages
         WHERE payload_json LIKE '%"task_id":"${taskId}"%' AND message_type = 'command'`,
			)
			.get() as any;

		return {
			task_id: taskId,
			current_agent: task.agent_id,
			status: task.status,
			loop_count: messages.count || 0,
		};
	}

	/**
	 * Automate entire workflow
	 */
	async runAutomatedWorkflow(taskName: string, spec: string): Promise<void> {
		console.log("\n🖖 Starting PM-Dev-QA Automated Workflow\n");

		// Step 1: PM creates spec
		const _taskId = await this.pmCreateSpec(taskName, spec);

		console.log("\n→ Workflow initiated. Agents will:");
		console.log("  1. PM → Dev: Send specification");
		console.log("  2. Dev: Implement feature");
		console.log("  3. Dev → QA: Request testing");
		console.log("  4a. QA → PM: Approve (if passing)");
		console.log("  4b. QA → Dev: Reject (if failing) [ADVERSARIAL]");
		console.log("  5. Loop until QA approves");
		console.log("\n🎯 Monitor in PICARD dashboard: picard\n");
	}
}

/**
 * Quick workflow launcher
 */
export async function launchPMDevQAWorkflow(
	project: string,
	taskName: string,
	spec: string,
): Promise<void> {
	const workflow = new PMDevQAWorkflow({
		project_id: project,
		pm_agent_id: "pm-agent-001",
		dev_agent_id: "dev-agent-001",
		qa_agent_id: "qa-agent-001",
	});

	await workflow.runAutomatedWorkflow(taskName, spec);
}
