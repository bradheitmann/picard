/**
 * PICARD Autonomous Agent Daemon
 * Makes agents act automatically on messages WITHOUT human intervention
 *
 * This is the KEY to true multi-agent autonomy:
 * - Agent receives message from another agent
 * - Daemon executes the agent automatically
 * - Agent completes work and responds
 * - NO HUMAN IN THE LOOP
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { PicardDB } from "../db.js";
import { MessageBroker } from "../message-broker.js";

interface AgentDaemonConfig {
	agent_id: string;
	platform: string;
	project_path: string;
	auto_execute: boolean; // If true, execute automatically on messages
	max_concurrent_tasks: number;
}

export class AgentDaemon {
	private config: AgentDaemonConfig;
	private broker: MessageBroker;
	private db: PicardDB;
	private running: boolean = false;
	private activeTasks: Set<string> = new Set();

	constructor(config: AgentDaemonConfig) {
		this.config = config;
		this.broker = new MessageBroker();
		this.db = new PicardDB();
	}

	/**
	 * Start daemon - polls for messages and executes automatically
	 */
	start(): void {
		this.running = true;
		console.log(`🤖 Agent daemon started: ${this.config.agent_id}`);
		console.log(`   Platform: ${this.config.platform}`);
		console.log(`   Auto-execute: ${this.config.auto_execute}`);

		// Poll for messages every 2 seconds
		this.pollMessages();
	}

	stop(): void {
		this.running = false;
		this.broker.close();
		this.db.close();
	}

	private async pollMessages(): Promise<void> {
		if (!this.running) return;

		try {
			// Check for pending messages
			const messages = this.broker.getPendingMessages(this.config.agent_id);

			for (const message of messages) {
				// Check if we can execute (not at max capacity)
				if (this.activeTasks.size >= this.config.max_concurrent_tasks) {
					console.log(
						`⏸️  Agent ${this.config.agent_id} at capacity, queueing...`,
					);
					break;
				}

				// Execute message automatically
				if (this.config.auto_execute) {
					await this.executeMessage(message);
				} else {
					console.log(`📬 Message received (manual execution required)`);
					console.log(`   From: ${message.from}`);
					console.log(`   Type: ${message.type}`);
				}

				// Mark as delivered
				this.broker.markDelivered(message.id);
			}
		} catch (error) {
			console.error(`Error polling messages: ${error}`);
		}

		// Continue polling
		setTimeout(() => this.pollMessages(), 2000);
	}

	/**
	 * Execute message autonomously
	 */
	private async executeMessage(message: any): Promise<void> {
		console.log(`\n🚀 AUTO-EXECUTING: ${message.type}`);
		console.log(`   From: ${message.from} → To: ${this.config.agent_id}`);

		const payload = message.payload as any;

		// Route based on message type and action
		if (message.type === "command") {
			switch (payload.action) {
				case "implement_feature":
					await this.implementFeature(payload);
					break;

				case "test_implementation":
					await this.testImplementation(payload);
					break;

				case "fix_issues":
					await this.fixIssues(payload);
					break;

				default:
					console.log(`   Unknown action: ${payload.action}`);
			}
		}

		this.broker.markRead(message.id);
	}

	/**
	 * AUTO-EXECUTE: Implement feature (Dev agent)
	 */
	private async implementFeature(payload: any): Promise<void> {
		const { task_id, specification } = payload;

		console.log(`   📝 Implementing: ${specification.substring(0, 50)}...`);

		this.activeTasks.add(task_id);

		try {
			// Launch Claude Code/Cursor to implement
			const bridge = `${process.env.HOME}/.dev/orchestration/bridges/${this.config.platform}.sh`;

			if (existsSync(bridge)) {
				// Execute agent to implement feature
				// Agent reads specification from task file
				await this.writeTaskFile(task_id, specification);

				// Trigger agent execution
				const result = spawn(
					bridge,
					["execute_task", this.config.agent_id, task_id],
					{
						cwd: this.config.project_path,
						stdio: "inherit",
					},
				);

				await new Promise((resolve) => result.on("exit", resolve));

				// After implementation, send to QA
				const files = await this.getModifiedFiles();

				await this.broker.sendMessage(
					this.config.agent_id,
					"qa-agent-001", // TODO: Get from team config
					"command",
					{
						action: "test_implementation",
						task_id,
						files_changed: files,
					},
				);

				console.log(`   ✅ Implementation complete → Sent to QA`);
			}
		} finally {
			this.activeTasks.delete(task_id);
		}
	}

	/**
	 * AUTO-EXECUTE: Test implementation (QA agent)
	 */
	private async testImplementation(payload: any): Promise<void> {
		const { task_id, files_changed, coverage_required } = payload;

		console.log(`   🧪 Testing files: ${files_changed.join(", ")}`);

		this.activeTasks.add(task_id);

		try {
			// Run tests automatically
			const testResult = spawn("bun", ["test"], {
				cwd: this.config.project_path,
				stdio: "pipe",
			});

			let output = "";
			testResult.stdout?.on("data", (data) => {
				output += data.toString();
			});

			await new Promise((resolve) => testResult.on("exit", resolve));

			// Parse test results
			const passed = !output.includes("fail");
			const coverage = this.extractCoverage(output);

			if (passed && coverage >= coverage_required) {
				// APPROVE: Send to PM
				await this.broker.sendMessage(
					this.config.agent_id,
					"pm-agent-001",
					"notification",
					{
						action: "task_completed",
						task_id,
						status: "APPROVED",
						test_results: { passed: true, coverage },
					},
				);

				console.log(`   ✅ Tests PASSED → Approved, notified PM`);
			} else {
				// REJECT: Send back to Dev (ADVERSARIAL)
				await this.broker.sendMessage(
					this.config.agent_id,
					"dev-agent-001",
					"command",
					{
						action: "fix_issues",
						task_id,
						failures: this.extractFailures(output),
						severity: "high",
					},
				);

				console.log(
					`   ❌ Tests FAILED → Rejected, sent back to Dev (adversarial)`,
				);
			}
		} finally {
			this.activeTasks.delete(task_id);
		}
	}

	/**
	 * AUTO-EXECUTE: Fix issues (Dev agent - rework loop)
	 */
	private async fixIssues(payload: any): Promise<void> {
		const { task_id, failures } = payload;

		console.log(`   🔧 Fixing issues: ${failures.join(", ")}`);

		// Re-execute agent with failure context
		await this.implementFeature({
			task_id,
			specification: `Fix these issues: ${failures.join("\n")}`,
		});
	}

	// Helper methods
	private async writeTaskFile(taskId: string, spec: string): Promise<void> {
		const taskFile = `${this.config.project_path}/.picard/tasks/${taskId}.md`;
		await Bun.write(taskFile, spec);
	}

	private async getModifiedFiles(): Promise<string[]> {
		// Git diff to find changed files
		const result = spawn("git", ["diff", "--name-only", "HEAD"], {
			cwd: this.config.project_path,
			stdio: "pipe",
		});

		let output = "";
		result.stdout?.on("data", (data) => {
			output += data.toString();
		});

		await new Promise((resolve) => result.on("exit", resolve));

		return output.split("\n").filter((f) => f.length > 0);
	}

	private extractCoverage(testOutput: string): number {
		// Extract coverage from test output
		const match = testOutput.match(/coverage:\s*(\d+)%/);
		return match ? parseInt(match[1]) : 0;
	}

	private extractFailures(testOutput: string): string[] {
		// Extract failure messages
		const failures: string[] = [];
		const lines = testOutput.split("\n");

		for (const line of lines) {
			if (line.includes("fail") || line.includes("error")) {
				failures.push(line.trim());
			}
		}

		return failures;
	}
}

/**
 * Launch daemon for an agent
 */
export function launchAgentDaemon(config: AgentDaemonConfig): AgentDaemon {
	const daemon = new AgentDaemon(config);
	daemon.start();
	return daemon;
}
