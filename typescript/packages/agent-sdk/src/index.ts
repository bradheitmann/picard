/**
 * @picard/agent-sdk
 * Universal SDK for agents to communicate with PICARD and each other
 * Works in: Browser, Node.js, Bun, Deno, CLI scripts
 */

export interface PicardEvent {
	type: string;
	timestamp: string;
	agent_id: string;
	session_id: string;
	task_id?: string;
	project?: string;
	team_id?: string;
	metadata?: Record<string, unknown>;
}

export interface Message {
	id: string;
	from: string;
	to: string;
	type: "command" | "response" | "notification" | "context_share";
	payload: unknown;
	timestamp: string;
}

export interface AgentConfig {
	id: string;
	name?: string;
	platform: string;
	picard_url?: string;
	session_id?: string;
	team_id?: string;
}

export class PicardAgent {
	private config: AgentConfig;
	private picardUrl: string;
	private sessionId: string;
	private messageHandlers: Map<string, ((msg: Message) => void)[]> = new Map();

	constructor(config: AgentConfig) {
		this.config = config;
		this.picardUrl = config.picard_url || "http://localhost:8765";
		this.sessionId = config.session_id || `sess_${Date.now()}_${config.id}`;

		// Start listening for messages
		this.startMessageListener();
	}

	/**
	 * Emit event to PICARD
	 */
	async emit(
		type: string,
		metadata: Record<string, unknown> = {},
	): Promise<void> {
		const event: PicardEvent = {
			type,
			timestamp: new Date().toISOString(),
			agent_id: this.config.id,
			session_id: this.sessionId,
			project: metadata.project as string,
			task_id: metadata.task_id as string,
			team_id: this.config.team_id,
			metadata,
		};

		try {
			await fetch(`${this.picardUrl}/events`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(event),
			});
		} catch (_error) {
			// Fallback: write to local file if server unavailable
			this.writeToLocalLog(event);
		}
	}

	/**
	 * Send message to another agent
	 */
	async sendMessage(
		to: string,
		type: Message["type"],
		payload: unknown,
	): Promise<void> {
		const message: Message = {
			id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
			from: this.config.id,
			to,
			type,
			payload,
			timestamp: new Date().toISOString(),
		};

		await fetch(`${this.picardUrl}/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(message),
		});
	}

	/**
	 * Register handler for incoming messages
	 */
	onMessage(type: Message["type"], handler: (msg: Message) => void): void {
		if (!this.messageHandlers.has(type)) {
			this.messageHandlers.set(type, []);
		}
		this.messageHandlers.get(type)?.push(handler);
	}

	/**
	 * Listen for messages from other agents
	 */
	private async startMessageListener(): Promise<void> {
		// Poll for messages (in production, use WebSocket)
		setInterval(async () => {
			try {
				const response = await fetch(
					`${this.picardUrl}/messages/${this.config.id}`,
				);
				const messages = (await response.json()) as Message[];

				for (const msg of messages) {
					const handlers = this.messageHandlers.get(msg.type) || [];
					for (const handler of handlers) {
						handler(msg);
					}
				}
			} catch {
				// Server unavailable, skip
			}
		}, 2000); // Poll every 2 seconds
	}

	/**
	 * Fallback: write to local event log
	 */
	private writeToLocalLog(event: PicardEvent): void {
		// Bun environment
		if (typeof process !== "undefined" && process.env.HOME) {
			const logPath = `${process.env.HOME}/.dev/logs/events/global-stream.jsonl`;
			const eventLine = `${JSON.stringify(event)}\n`;

			if (typeof Bun !== "undefined") {
				const file = Bun.file(logPath);
				Bun.write(file, eventLine);
			} else {
				// Node environment
				const fs = require("node:fs");
				fs.appendFileSync(logPath, eventLine);
			}
		}
	}

	/**
	 * Task lifecycle helpers
	 */
	async claimTask(
		taskId: string,
		metadata: Record<string, unknown> = {},
	): Promise<void> {
		await this.emit("task.claimed", { task_id: taskId, ...metadata });
	}

	async completeTask(
		taskId: string,
		outcome: "success" | "failure",
		metadata: Record<string, unknown> = {},
	): Promise<void> {
		await this.emit("task.completed", {
			task_id: taskId,
			outcome,
			...metadata,
		});
	}

	async reportProgress(
		taskId: string,
		progress: number,
		message: string,
	): Promise<void> {
		await this.emit("task.progress", { task_id: taskId, progress, message });
	}

	/**
	 * File operation helpers
	 */
	async logFileWrite(
		filePath: string,
		linesAdded: number,
		metadata: Record<string, unknown> = {},
	): Promise<void> {
		await this.emit("action.file_write", {
			file_path: filePath,
			lines_added: linesAdded,
			...metadata,
		});
	}

	async logFileRead(filePath: string): Promise<void> {
		await this.emit("action.file_read", { file_path: filePath });
	}

	/**
	 * Command execution helper
	 */
	async logCommand(
		command: string,
		exitCode: number,
		duration: number,
	): Promise<void> {
		await this.emit("action.bash_command", {
			command,
			exit_code: exitCode,
			duration_ms: duration,
		});
	}
}

/**
 * Platform-specific helpers
 */

// Runtime environment detection
export const isBrowser =
	typeof globalThis !== "undefined" && "document" in globalThis;
export const isNode = typeof process !== "undefined" && !isBrowser;
export const isBun = typeof Bun !== "undefined";
export const isDeno = typeof globalThis !== "undefined" && "Deno" in globalThis;

// Quick agent creation
export function createAgent(
	id: string,
	platform: string,
	options: Partial<AgentConfig> = {},
): PicardAgent {
	return new PicardAgent({
		id,
		platform,
		...options,
	});
}
