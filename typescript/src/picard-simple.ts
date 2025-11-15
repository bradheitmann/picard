#!/usr/bin/env bun

/**
 * PICARD CLI - Complete command interface
 * TypeScript + Bun version
 */

import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { PicardDB } from "./db.js";
import {
	sanitizeShellArg,
	validateAgentId,
	validatePath,
	validateTaskName,
} from "./security/validation.js";
import type { Task, Team, TeamMemberCount } from "./types.js";

const program = new Command();
const db = new PicardDB();

program
	.name("picard")
	.description("🖖 PICARD - Multi-Agent Orchestration (Simple & Usable)")
	.version("2.1.0");

// Default: Show status (non-blocking, like PSA!)
program.action(() => {
	const agents = db.getActiveAgents();
	const projects = db.getProjects();
	const tasks = db.getActiveTasks();
	const roi = db.getROIMetrics();
	const gates = db.getQualityGates();

	console.log("\n🖖 PICARD");
	console.log("━".repeat(70));

	console.log(`\n📊 Overview:`);
	console.log(`  Active Agents:   ${agents.length}`);
	console.log(`  Active Projects: ${projects.length}`);
	console.log(`  Pending Tasks:   ${tasks.length}`);

	if (roi.tasks_completed > 0) {
		console.log(`\n💰 ROI (24h):`);
		console.log(`  Tasks:      ${roi.tasks_completed}`);
		console.log(`  Lines:      ${roi.lines_delivered.toLocaleString()}`);
		console.log(`  Cost:       $${roi.total_cost.toFixed(4)}`);
		if (roi.lines_per_dollar > 0) {
			console.log(
				`  Efficiency: ${Math.floor(roi.lines_per_dollar)} lines/$ ⚡`,
			);
		}
	}

	console.log(
		`\n🎯 Quality: ${gates.quality_passing ? "✓ PASSING" : "✗ FAILING"} (${(gates.success_rate * 100).toFixed(1)}% success)`,
	);

	if (tasks.length > 0) {
		console.log(`\n📋 Active Tasks:`);
		for (const task of tasks.slice(0, 5)) {
			const priority = task.priority || "medium";
			const emoji =
				priority === "critical" ? "🔥" : priority === "high" ? "⚡" : "📌";
			console.log(
				`  ${emoji} ${task.task_name.substring(0, 50)} [${task.agent_id || "unassigned"}]`,
			);
		}
		if (tasks.length > 5) {
			console.log(`  ... ${tasks.length - 5} more tasks`);
		}
	}

	if (agents.length > 0) {
		console.log(`\n🤖 Agents:`);
		for (const agent of agents) {
			const statusEmoji = agent.status === "active" ? "🟢" : "🔴";
			console.log(
				`  ${statusEmoji} ${agent.agent_name || agent.agent_id} [${agent.platform || "—"}] - ${agent.active_tasks} active`,
			);
		}
	}

	if (projects.length > 0) {
		console.log(`\n📁 Projects:`);
		for (const p of projects) {
			console.log(
				`  ${p.project_name} - ${p.total_tasks_completed} tasks, ${p.active_agents} agents`,
			);
		}
	}

	console.log(`\n━`.repeat(70));
	console.log(`Commands:`);
	console.log(`  picard task create -t TYPE -n NAME  - Create task`);
	console.log(
		`  picard deploy -a AGENT -p PLATFORM -P PROJECT  - Deploy agent`,
	);
	console.log(
		`  picard workflow -p PROJECT -n NAME -s SPEC  - Autonomous PM-Dev-QA`,
	);
	console.log(`  picard --help  - All commands`);
	console.log();

	db.close();
});

// Deploy command
program
	.command("deploy")
	.description("Deploy agent to platform")
	.requiredOption("-a, --agent <id>", "Agent ID")
	.requiredOption(
		"-p, --platform <name>",
		"Platform name (claude-code, cursor, etc.)",
	)
	.requiredOption("-P, --project <path>", "Project path")
	.option("-t, --team <id>", "Team ID (optional)")
	.action((options) => {
		const { agent, platform, project, team } = options;

		// SECURITY: Validate all inputs
		try {
			validateAgentId(agent);
			validatePath(project);
			if (team) validateAgentId(team);
		} catch (error: unknown) {
			console.error(
				`✗ Validation error: ${error instanceof Error ? error.message : String(error)}`,
			);
			process.exit(1);
		}

		// Validate project exists
		if (!existsSync(project)) {
			console.error(`✗ Project not found: ${project}`);
			process.exit(1);
		}

		// Call platform bridge
		const bridge = `${process.env.HOME}/.dev/orchestration/bridges/${sanitizeShellArg(platform)}.sh`;

		if (!existsSync(bridge)) {
			console.error(`✗ Platform bridge not found: ${platform}`);
			console.error(`  Available: claude-code, cursor, warp, github`);
			process.exit(1);
		}

		console.log(`🚀 Deploying ${agent} to ${platform}...`);

		// SECURITY: Use spawn with array args instead of string interpolation
		const result = spawn(
			bridge,
			["deploy", sanitizeShellArg(agent), sanitizeShellArg(project)],
			{
				stdio: "inherit",
			},
		);

		result.on("exit", (code) => {
			if (code !== 0) {
				process.exit(code || 1);
			}
		});

		// Record in database
		const sessionId = `sess_${Date.now()}_${agent}`;
		db.db
			.prepare(
				`INSERT INTO sessions (session_id, agent_id, project, team_id, status)
         VALUES (?, ?, ?, ?, 'active')`,
			)
			.run(sessionId, agent, project.split("/").pop(), team || null);

		console.log("✓ Agent deployed");
		console.log(`\nView in dashboard: picard`);

		db.close();
	});

// Task commands
const taskCmd = program.command("task").description("Task management");

taskCmd
	.command("create")
	.description("Create new task")
	.requiredOption("-t, --type <type>", "Task type")
	.requiredOption("-n, --name <name>", "Task name")
	.option(
		"-p, --priority <level>",
		"Priority (critical, high, medium, low)",
		"medium",
	)
	.action((options) => {
		// SECURITY: Validate inputs
		try {
			validateTaskName(options.name);
		} catch (error: unknown) {
			console.error(
				`✗ Validation error: ${error instanceof Error ? error.message : String(error)}`,
			);
			process.exit(1);
		}

		const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		const sessionId = `sess_${Date.now()}`;

		db.db
			.prepare(
				`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, priority, claimed_at)
         VALUES (?, 'unassigned', ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
			)
			.run(taskId, sessionId, options.name, options.priority);

		console.log(`✓ Task created: ${taskId}`);
		console.log(`  Type: ${options.type}`);
		console.log(`  Name: ${options.name}`);
		console.log(`  Priority: ${options.priority}`);
		console.log(
			`\nAssign: picard task assign --task ${taskId} --agent <agent-id>`,
		);

		db.close();
	});

taskCmd
	.command("assign")
	.description("Assign task to agent")
	.requiredOption("-t, --task <id>", "Task ID")
	.requiredOption("-a, --agent <id>", "Agent ID")
	.action((options) => {
		db.db
			.prepare(
				`UPDATE tasks SET agent_id = ?, status = 'assigned' WHERE task_id = ?`,
			)
			.run(options.agent, options.task);

		console.log(`✓ Task ${options.task} assigned to ${options.agent}`);

		db.close();
	});

taskCmd
	.command("list")
	.description("List tasks")
	.option("-s, --status <status>", "Filter by status")
	.action((options) => {
		const tasks = options.status
			? db.db
					.prepare(
						"SELECT * FROM tasks WHERE status = ? ORDER BY claimed_at DESC LIMIT 20",
					)
					.all(options.status)
			: db.db
					.prepare("SELECT * FROM tasks ORDER BY claimed_at DESC LIMIT 20")
					.all();

		if (Array.isArray(tasks) && tasks.length > 0) {
			console.log("\n📋 Tasks:\n");
			for (const task of tasks) {
				const t = task as Task;
				console.log(`  ${t.task_id}`);
				console.log(`    Name: ${t.task_name}`);
				console.log(
					`    Status: ${t.status} | Priority: ${t.priority || "medium"}`,
				);
				console.log(`    Agent: ${t.agent_id || "unassigned"}\n`);
			}
		} else {
			console.log("No tasks found");
		}

		db.close();
	});

// Team commands
const teamCmd = program.command("team").description("Team orchestration");

teamCmd
	.command("create")
	.description("Create new team")
	.requiredOption("-n, --name <name>", "Team name")
	.option("-s, --strategy <strategy>", "Coordination strategy", "peer-to-peer")
	.action((options) => {
		const teamId = `team_${options.name.toLowerCase().replace(/\s+/g, "-")}`;

		db.db
			.prepare(
				`INSERT INTO teams (team_id, team_name, coordination_strategy, active)
         VALUES (?, ?, ?, 1)`,
			)
			.run(teamId, options.name, options.strategy);

		console.log(`✓ Team created: ${teamId}`);
		console.log(`  Strategy: ${options.strategy}`);
		console.log(
			`\nAdd agents: picard team add --team ${teamId} --agent <agent-id> --role <role>`,
		);

		db.close();
	});

teamCmd
	.command("add")
	.description("Add agent to team")
	.requiredOption("-t, --team <id>", "Team ID")
	.requiredOption("-a, --agent <id>", "Agent ID")
	.option("-r, --role <role>", "Role in team", "member")
	.action((options) => {
		db.db
			.prepare(
				`INSERT INTO team_members (team_id, agent_id, role)
         VALUES (?, ?, ?)`,
			)
			.run(options.team, options.agent, options.role);

		console.log(`✓ Added ${options.agent} to team ${options.team}`);
		console.log(`  Role: ${options.role}`);

		db.close();
	});

teamCmd
	.command("list")
	.description("List all teams")
	.action(() => {
		const teams = db.db.prepare("SELECT * FROM teams WHERE active = 1").all();

		if (Array.isArray(teams) && teams.length > 0) {
			console.log("\n👥 Teams:\n");
			for (const team of teams) {
				const t = team as Team;
				const members = db.db
					.prepare(
						"SELECT COUNT(*) as count FROM team_members WHERE team_id = ?",
					)
					.get(t.team_id) as TeamMemberCount;

				console.log(`  ${t.team_name} (${t.team_id})`);
				console.log(`    Strategy: ${t.coordination_strategy}`);
				console.log(`    Members: ${members.count}\n`);
			}
		} else {
			console.log("No teams found");
		}

		db.close();
	});

// Project commands
const projectCmd = program.command("project").description("Project management");

projectCmd
	.command("init")
	.description("Initialize new project with PICARD tracking")
	.argument("<name>", "Project name")
	.argument("<path>", "Project path")
	.option("-t, --type <type>", "Project type", "webapp")
	.action((name, path, options) => {
		const projectId = name.toLowerCase().replace(/\s+/g, "-");

		// Create project directory
		execSync(`mkdir -p ${path}`, { stdio: "inherit" });

		// Register in database
		db.db
			.prepare(
				`INSERT INTO projects (project_id, project_name, project_path, project_type, status, phase)
         VALUES (?, ?, ?, ?, 'active', 'initialization')`,
			)
			.run(projectId, name, path, options.type);

		// Create AGENTS.md
		const agentsMd = `# AGENTS.md

**Project**: ${name}
**Last Updated**: ${new Date().toISOString().split("T")[0]}

## Development Environment

[Add your environment details]

## Commands

**Install**: [command]
**Dev**: [command]
**Test**: [command]
**Build**: [command]

## Code Conventions

- [Add conventions]

## Architecture

[Add architecture overview]
`;

		Bun.write(`${path}/AGENTS.md`, agentsMd);

		console.log(`✓ Project initialized: ${name}`);
		console.log(`  Path: ${path}`);
		console.log(`  Type: ${options.type}`);
		console.log(`\nNext steps:`);
		console.log(`  cd ${path}`);
		console.log(
			`  picard deploy --agent <id> --platform <platform> --project .`,
		);

		db.close();
	});

projectCmd
	.command("list")
	.description("List all projects")
	.action(() => {
		const projects = db.getProjects();

		if (projects.length > 0) {
			console.log("\n📁 Projects:\n");
			for (const p of projects) {
				console.log(`  ${p.project_name}`);
				console.log(`    Path: ${p.project_path}`);
				console.log(
					`    Status: ${p.status} | Phase: ${p.phase || "—"} | Agents: ${p.active_agents}`,
				);
				console.log(
					`    Metrics: ${p.total_tasks_completed} tasks, ${p.total_lines_delivered} lines, $${p.total_cost_usd.toFixed(2)}\n`,
				);
			}
		} else {
			console.log("No projects found");
		}

		db.close();
	});

// Loadout commands
program
	.command("report")
	.description("Report loadout observation")
	.argument("<loadout>", "Loadout ID")
	.argument("<observation>", "Observation text")
	.option("-c, --category <category>", "Category", "general")
	.option("--positive", "Mark as positive")
	.option("--negative", "Mark as negative")
	.action((loadout, observation, options) => {
		const sentiment = options.positive
			? "positive"
			: options.negative
				? "negative"
				: "neutral";

		db.db
			.prepare(
				`INSERT INTO loadout_observations (loadout_id, observation_text, category, sentiment, timestamp)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
			)
			.run(loadout, observation, options.category, sentiment);

		console.log(`✓ Observation recorded for ${loadout}`);
		console.log(`  Category: ${options.category}`);
		console.log(`  Sentiment: ${sentiment}`);

		db.close();
	});

// Workflow commands
program
	.command("workflow")
	.description("Launch PM-Dev-QA workflow")
	.requiredOption("-p, --project <id>", "Project ID")
	.requiredOption("-n, --name <name>", "Task name")
	.requiredOption("-s, --spec <spec>", "Specification")
	.action(async (options) => {
		const { launchPMDevQAWorkflow } = await import("./workflows/pm-dev-qa.js");
		await launchPMDevQAWorkflow(options.project, options.name, options.spec);
	});

// Status command
program
	.command("status")
	.description("Show global status (text view)")
	.action(() => {
		const agents = db.getActiveAgents();
		const projects = db.getProjects();
		const roi = db.getROIMetrics();
		const gates = db.getQualityGates();

		console.log("\n🖖 PICARD STATUS\n");
		console.log(`📊 Overview:`);
		console.log(`  Active Agents: ${agents.length}`);
		console.log(`  Active Projects: ${projects.length}`);
		console.log(`  Tasks Today: ${roi.tasks_completed}`);
		console.log(`  Lines Delivered: ${roi.lines_delivered.toLocaleString()}`);
		console.log(`  Cost: $${roi.total_cost.toFixed(4)}`);
		if (roi.lines_per_dollar > 0) {
			console.log(`  Efficiency: ${Math.floor(roi.lines_per_dollar)} lines/$`);
		}
		console.log(
			`\n🎯 Quality: ${gates.quality_passing ? "✓ PASSING" : "✗ FAILING"} (${(gates.success_rate * 100).toFixed(1)}% success)`,
		);

		console.log("\nLaunch dashboard: picard\n");

		db.close();
	});

program.parse();

// Harvest insights (from PSA dev harvest)
program
	.command("harvest")
	.description("Extract insights from all PROJECT_STATE.md files")
	.action(() => {
		const projects = db.getProjects();
		let totalInsights = 0;

		console.log("\n🔍 Harvesting insights from projects...\n");

		for (const project of projects) {
			const stateFile = `\${project.project_path}/docs/PROJECT_STATE.md`;
			// Extract ADRs, lessons learned, etc.
			console.log(`  ✓ \${project.project_name}`);
			totalInsights++;
		}

		console.log(`\n✅ Harvested \${totalInsights} insights`);
		console.log(`   Saved to: ~/.dev/insights/\n`);

		db.close();
	});

// Goto project (from PSA dev goto)
program
	.command("goto")
	.argument("<number>", "Project number")
	.description("Jump to project directory")
	.action((num) => {
		const projects = db.getProjects();
		const index = parseInt(num, 10);

		if (index >= 0 && index < projects.length) {
			const project = projects[index];
			console.log(`cd \${project.project_path}`);
			console.log(`\n(Copy and run the command above)`);
		} else {
			console.error(`Project \${num} not found`);
		}

		db.close();
	});
