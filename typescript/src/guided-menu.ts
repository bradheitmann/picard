#!/usr/bin/env bun
/**
 * PICARD Guided Menu - Zero Learning Curve
 * Just answer questions, no syntax to memorize
 */

import { PicardDB } from "./db.js";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";

const db = new PicardDB();
const rl = readline.createInterface({ input, output });

function ask(question: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer.trim());
		});
	});
}

async function main() {
	console.clear();
	console.log("\n🖖 PICARD");
	console.log("━".repeat(60));

	// Show current state
	const projects = db.getProjects();
	const agents = db.getActiveAgents();
	const tasks = db.getActiveTasks();

	console.log(`\n📊 Current Status:`);
	console.log(`  Projects: ${projects.length}`);
	console.log(`  Agents:   ${agents.length}`);
	console.log(`  Tasks:    ${tasks.length}`);

	console.log("\n" + "━".repeat(60));
	console.log("\nWhat would you like to do?\n");

	console.log("1. Create a new task");
	console.log("2. Create a team");
	console.log("3. Start a new project");
	console.log("4. View my projects");
	console.log("5. Deploy an agent");
	console.log("6. Run PM-Dev-QA workflow");
	console.log("7. Exit");

	const choice = await ask("\nEnter number (1-7): ");

	switch (choice) {
		case "1":
			await createTask();
			break;
		case "2":
			await createTeam();
			break;
		case "3":
			await createProject();
			break;
		case "4":
			viewProjects();
			break;
		case "5":
			await deployAgent();
			break;
		case "6":
			await startWorkflow();
			break;
		case "7":
			console.log("\n🖖 Make it so!\n");
			rl.close();
			db.close();
			process.exit(0);
		default:
			console.log("\nInvalid choice. Try again.\n");
	}

	rl.close();
	db.close();
}

async function createTask() {
	console.log("\n✨ Create New Task");
	console.log("━".repeat(60));

	const name = await ask("\nWhat should this task be called? ");
	const type = await ask("What type of task? (feature/bug/docs/test): ");
	const priority = await ask("How urgent? (low/medium/high/critical): ");

	const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

	db.db
		.prepare(
			`INSERT INTO tasks (task_id, agent_id, session_id, task_name, status, priority, claimed_at)
       VALUES (?, 'unassigned', ?, ?, 'pending', ?, CURRENT_TIMESTAMP)`,
		)
		.run(taskId, `sess_${Date.now()}`, name, priority || "medium");

	console.log(`\n✅ Task created: ${name}`);
	console.log(`   Priority: ${priority || "medium"}`);
	console.log(`   ID: ${taskId}\n`);
}

async function createTeam() {
	console.log("\n✨ Create New Team");
	console.log("━".repeat(60));

	const name = await ask("\nWhat's your team name? ");
	const strategy = await ask(
		"Coordination strategy? (leader-follower/peer-to-peer): ",
	);

	const teamId = `team_${name.toLowerCase().replace(/\s+/g, "-")}`;

	db.db
		.prepare(
			`INSERT INTO teams (team_id, team_name, coordination_strategy, active)
       VALUES (?, ?, ?, 1)`,
		)
		.run(teamId, name, strategy || "peer-to-peer");

	console.log(`\n✅ Team created: ${name}`);
	console.log(`   Strategy: ${strategy || "peer-to-peer"}`);
	console.log(`   ID: ${teamId}\n`);
}

async function createProject() {
	console.log("\n✨ Initialize New Project");
	console.log("━".repeat(60));

	const name = await ask("\nProject name? ");
	const path = await ask("Where should it go? (full path): ");
	const type = await ask("Project type? (webapp/cli/library/api): ");

	const projectId = name.toLowerCase().replace(/\s+/g, "-");

	// Create directory
	const { spawn } = await import("node:child_process");
	const mkdir = spawn("mkdir", ["-p", path]);
	await new Promise((resolve) => mkdir.on("exit", resolve));

	// Register
	db.db
		.prepare(
			`INSERT INTO projects (project_id, project_name, project_path, project_type, status, phase)
       VALUES (?, ?, ?, ?, 'active', 'initialization')`,
		)
		.run(projectId, name, path, type || "webapp");

	console.log(`\n✅ Project created: ${name}`);
	console.log(`   Location: ${path}`);
	console.log(`   Type: ${type || "webapp"}\n`);
}

function viewProjects() {
	console.log("\n📁 Your Projects");
	console.log("━".repeat(60));

	const projects = db.getProjects();

	if (projects.length === 0) {
		console.log("\nNo projects yet. Create one with option 3!\n");
		return;
	}

	projects.forEach((p, i) => {
		console.log(`\n${i}. ${p.project_name}`);
		console.log(`   Path: ${p.project_path}`);
		console.log(
			`   Status: ${p.status} | ${p.total_tasks_completed} tasks completed`,
		);
	});

	console.log();
}

async function deployAgent() {
	console.log("\n✨ Deploy Agent");
	console.log("━".repeat(60));
	console.log(
		"\nThis requires some setup. See documentation for details.",
	);
	console.log("Documentation: cat ~/.dev/PICARD_USER_MANUAL.md\n");
}

async function startWorkflow() {
	console.log("\n✨ Start PM-Dev-QA Workflow");
	console.log("━".repeat(60));
	console.log(
		"\nThis requires agents to be deployed first. See documentation.",
	);
	console.log("Documentation: cat ~/.dev/PICARD_USER_MANUAL.md\n");
}

main();
