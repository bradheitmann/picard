/**
 * PICARD Input Validation & Sanitization
 * Hardens all user inputs against injection attacks
 */

import { homedir } from "node:os";
import { resolve } from "node:path";

// Maximum sizes to prevent DOS
export const MAX_PAYLOAD_SIZE = 1_000_000; // 1MB
export const MAX_STRING_LENGTH = 10_000;
export const MAX_AGENT_ID_LENGTH = 100;
export const MAX_TASK_NAME_LENGTH = 500;

/**
 * Validate agent ID format
 */
export function validateAgentId(id: string): string {
	if (typeof id !== "string") {
		throw new Error("Agent ID must be a string");
	}

	if (id.length === 0) {
		throw new Error("Agent ID cannot be empty");
	}

	if (id.length > MAX_AGENT_ID_LENGTH) {
		throw new Error(`Agent ID too long (max ${MAX_AGENT_ID_LENGTH} chars)`);
	}

	// Only allow alphanumeric, hyphens, underscores
	if (!/^[a-z0-9_-]+$/i.test(id)) {
		throw new Error(
			"Agent ID can only contain letters, numbers, hyphens, underscores",
		);
	}

	return id;
}

/**
 * Validate and sanitize file paths
 */
export function validatePath(path: string): string {
	if (typeof path !== "string") {
		throw new Error("Path must be a string");
	}

	// Resolve to absolute path
	const absolutePath = resolve(path);

	// Must be within user's home directory
	const home = homedir();
	if (!absolutePath.startsWith(home)) {
		throw new Error("Path must be within home directory");
	}

	// No parent directory traversal
	if (path.includes("..")) {
		throw new Error("Path cannot contain '..'");
	}

	return absolutePath;
}

/**
 * Sanitize shell arguments
 */
export function sanitizeShellArg(arg: string): string {
	if (typeof arg !== "string") {
		throw new Error("Argument must be a string");
	}

	// Remove all shell metacharacters
	return arg.replace(/[;&|`$()<>]/g, "");
}

/**
 * Validate task name
 */
export function validateTaskName(name: string): string {
	if (typeof name !== "string") {
		throw new Error("Task name must be a string");
	}

	if (name.length === 0) {
		throw new Error("Task name cannot be empty");
	}

	if (name.length > MAX_TASK_NAME_LENGTH) {
		throw new Error(`Task name too long (max ${MAX_TASK_NAME_LENGTH} chars)`);
	}

	return name;
}

/**
 * Validate JSON payload size
 */
export function validatePayloadSize(payload: unknown): void {
	const json = JSON.stringify(payload);

	if (json.length > MAX_PAYLOAD_SIZE) {
		throw new Error(
			`Payload too large (${json.length} bytes, max ${MAX_PAYLOAD_SIZE} bytes)`,
		);
	}
}

/**
 * Sanitize metadata object
 */
export function sanitizeMetadata(
	metadata: Record<string, unknown>,
): Record<string, unknown> {
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(metadata)) {
		// Skip null/undefined
		if (value === null || value === undefined) {
			continue;
		}

		// Sanitize strings
		if (typeof value === "string") {
			sanitized[key] = value.slice(0, MAX_STRING_LENGTH);
		}
		// Keep numbers, booleans as-is
		else if (typeof value === "number" || typeof value === "boolean") {
			sanitized[key] = value;
		}
		// Recursively sanitize objects (shallow)
		else if (typeof value === "object" && !Array.isArray(value)) {
			sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
		}
	}

	return sanitized;
}

/**
 * Rate limiter (prevent spam)
 */
export class RateLimiter {
	private limits: Map<string, number[]> = new Map();
	private maxPerMinute: number;

	constructor(maxPerMinute: number = 100) {
		this.maxPerMinute = maxPerMinute;
	}

	check(key: string): boolean {
		const now = Date.now();
		const timestamps = this.limits.get(key) || [];

		// Remove timestamps older than 1 minute
		const recent = timestamps.filter((t) => now - t < 60000);

		if (recent.length >= this.maxPerMinute) {
			return false; // Rate limit exceeded
		}

		recent.push(now);
		this.limits.set(key, recent);
		return true;
	}

	reset(key: string): void {
		this.limits.delete(key);
	}
}
