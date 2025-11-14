/**
 * PICARD TypeScript Type Definitions
 */

export interface Agent {
	agent_id: string;
	agent_name: string | null;
	platform: string | null;
	agent_type: string | null;
	status: string;
	active_tasks: number;
	total_tasks_completed: number;
	total_tasks_failed: number;
}

export interface ROIMetrics {
	tasks_completed: number;
	total_tokens: number;
	total_cost: number;
	lines_delivered: number;
	files_delivered: number;
	cost_per_task: number;
	lines_per_dollar: number;
}

export interface QualityGates {
	success_rate: number;
	error_rate: number;
	quality_passing: boolean;
}

export interface Task {
	task_id: string;
	task_name: string;
	agent_id: string | null;
	status: string;
	priority: string | null;
}

export interface Event {
	timestamp: string;
	agent_id: string;
	event_type: string;
	project: string | null;
}

export interface DashboardData {
	agents: Agent[];
	roi: ROIMetrics;
	gates: QualityGates;
	tasks: Task[];
	events: Event[];
}
