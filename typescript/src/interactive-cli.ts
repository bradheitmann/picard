#!/usr/bin/env bun
/**
 * PICARD Interactive CLI - Actually Usable for Non-Programmers
 * Simple prompts, clear examples, friendly interface
 */

import { PicardDB } from "./db.js";
import { MessageBroker } from "./message-broker.js";

const db = new PicardDB();

console.log("\n🖖 PICARD - Multi-Agent Orchestration");
console.log("━".repeat(60));

// Show status
const agents = db.getActiveAgents();
const projects = db.getProjects();
const tasks = db.getActiveTasks();

console.log(`\n📊 You have:`);
console.log(`  ${projects.length} project${projects.length !== 1 ? "s" : ""}`);
console.log(`  ${agents.length} agent${agents.length !== 1 ? "s" : ""}`);
console.log(`  ${tasks.length} pending task${tasks.length !== 1 ? "s" : ""}`);

if (projects.length > 0) {
	console.log(`\n📁 Your Projects:`);
	projects.forEach((p, i) => {
		console.log(`  ${i}. ${p.project_name} (${p.total_tasks_completed} tasks completed)`);
	});
}

console.log("\n" + "━".repeat(60));
console.log("What would you like to do?\n");

console.log("📋 Common Tasks:");
console.log("  • Create a new task:        picard task create");
console.log("  • Create a new team:        picard team create");
console.log("  • Initialize new project:   picard project init");
console.log("  • See all commands:         picard --help");

console.log("\n💡 Examples:");
console.log("  picard team create -n 'My Team'");
console.log("  picard task create -t feature -n 'Build login page'");
console.log("  picard project list");

console.log("\n🔗 Quick Links:");
console.log("  Documentation: cat ~/.dev/PICARD_USER_MANUAL.md");
console.log("  Getting Started: cat ~/.dev/START_HERE.md");

console.log("\n" + "━".repeat(60) + "\n");

db.close();
