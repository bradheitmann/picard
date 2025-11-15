/**
 * PICARD Message Broker
 * Routes messages between agents for workflow automation
 */

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";

interface Message {
	id: string;
	from: string;
	to: string;
	type: "command" | "response" | "notification" | "context_share";
	payload: unknown;
	timestamp: string;
	status: "pending" | "delivered" | "failed";
}

export class MessageBroker {
	private db: Database;

	constructor(dbPath: string = join(homedir(), ".dev/logs/observability.db")) {
		this.db = new Database(dbPath);
		this.initMessageTable();
	}

	private initMessageTable(): void {
		this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        from_agent TEXT NOT NULL,
        to_agent TEXT NOT NULL,
        message_type TEXT NOT NULL,
        payload_json TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        delivered_at DATETIME,
        read_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_agent, status);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    `);
	}

	/**
	 * Send message from one agent to another
	 */
	async sendMessage(
		from: string,
		to: string,
		type: Message["type"],
		payload: unknown,
	): Promise<string> {
		const id = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		this.db
			.prepare(
				`INSERT INTO messages (id, from_agent, to_agent, message_type, payload_json, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
			)
			.run(id, from, to, type, JSON.stringify(payload));

		return id;
	}

	/**
	 * Get pending messages for an agent
	 */
	getPendingMessages(agentId: string): Message[] {
		const rows = this.db
			.prepare(
				`SELECT id, from_agent as from, to_agent as to, message_type as type,
                payload_json, timestamp, status
         FROM messages
         WHERE to_agent = ? AND status = 'pending'
         ORDER BY timestamp ASC`,
			)
			.all(agentId);

		return rows.map((row: any) => ({
			id: row.id,
			from: row.from,
			to: row.to,
			type: row.type,
			payload: JSON.parse(row.payload_json || "{}"),
			timestamp: row.timestamp,
			status: row.status,
		}));
	}

	/**
	 * Mark message as delivered
	 */
	markDelivered(messageId: string): void {
		this.db
			.prepare(
				`UPDATE messages
         SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
			)
			.run(messageId);
	}

	/**
	 * Mark message as read
	 */
	markRead(messageId: string): void {
		this.db
			.prepare(
				`UPDATE messages
         SET read_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
			)
			.run(messageId);
	}

	close(): void {
		this.db.close();
	}
}
