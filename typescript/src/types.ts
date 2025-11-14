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

export interface ContextUsage {
	agent_id: string;
	avg_input: number;
	max_input: number;
	context_window: number | null;
}

export interface TeamPerformance {
	team_id: string;
	team_size: number;
	tasks_completed: number;
	avg_task_time_sec: number;
}

export interface Project {
	project_id: string;
	project_name: string;
	project_path: string;
	status: string;
	phase: string | null;
	active_agents: number;
	total_tasks_completed: number;
	total_cost_usd: number;
	total_lines_delivered: number;
	lines_per_dollar: number;
	last_activity: string;
}

export interface Loadout {
	loadout_id: string;
	loadout_name: string;
	model: string;
	ide_platform: string | null;
	times_used: number;
	avg_cost_per_task: number | null;
	avg_lines_per_dollar: number | null;
	total_observations: number;
	positive_observations: number;
	negative_observations: number;
}

export interface DashboardData {
	agents: Agent[];
	roi: ROIMetrics;
	gates: QualityGates;
	tasks: Task[];
	events: Event[];
	context: ContextUsage[];
	teams: TeamPerformance[];
	projects: Project[];
	loadouts: Loadout[];
}
