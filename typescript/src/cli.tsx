#!/usr/bin/env bun

/**
 * 🖖 PICARD - TypeScript + Bun Version
 * Multi-Agent Orchestration Dashboard
 */

import { Box, render, Text } from "ink";
import { useEffect, useState } from "react";
import { PicardDB } from "./db.js";
import type { DashboardData } from "./types.js";

const BANNER = `
    ██████╗ ██╗ ██████╗ █████╗ ██████╗ ██████╗
    ██╔══██╗██║██╔════╝██╔══██╗██╔══██╗██╔══██╗
    ██████╔╝██║██║     ███████║██████╔╝██║  ██║
    ██╔═══╝ ██║██║     ██╔══██║██╔══██╗██║  ██║
    ██║     ██║╚██████╗██║  ██║██║  ██║██████╔╝
    ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝

    🖖 Project Intelligence, Coordination, And Resource Deployment 🖖
                        "Make It So"
`;

function Dashboard() {
	const [data, setData] = useState<DashboardData | null>(null);
	const db = new PicardDB();

	useEffect(() => {
		const updateData = () => {
			try {
				setData({
					agents: db.getActiveAgents(),
					roi: db.getROIMetrics(),
					gates: db.getQualityGates(),
					tasks: db.getActiveTasks(),
					events: db.getRecentEvents(5),
				});
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		updateData();
		const interval = setInterval(updateData, 1000);

		return () => {
			clearInterval(interval);
			db.close();
		};
	}, [
		db.close,
		db.getActiveAgents,
		db.getActiveTasks,
		db.getQualityGates,
		db.getROIMetrics,
		db.getRecentEvents,
	]);

	if (!data) {
		return (
			<Box flexDirection="column">
				<Text color="red" bold>
					🖖 PICARD initializing...
				</Text>
			</Box>
		);
	}

	const { agents, roi, gates, tasks, events } = data;

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box borderStyle="double" borderColor="red" padding={1}>
				<Text color="red" bold>
					{BANNER}
				</Text>
			</Box>

			{/* Main Content */}
			<Box marginTop={1}>
				<Box flexDirection="row" flexGrow={1}>
					{/* Left Column */}
					<Box flexDirection="column" width="50%" marginRight={2}>
						{/* Agent Fleet */}
						<Box
							borderStyle="round"
							borderColor="red"
							padding={1}
							marginBottom={1}
						>
							<Box flexDirection="column">
								<Text color="yellow" bold>
									🤖 AGENT FLEET
								</Text>
								<Box marginTop={1}>
									{agents.length > 0 ? (
										agents.map((agent) => (
											<Text key={agent.agent_id}>
												{agent.agent_name || agent.agent_id} | {agent.status} |
												Tasks: {agent.active_tasks}
											</Text>
										))
									) : (
										<Text dimColor>No active agents</Text>
									)}
								</Box>
							</Box>
						</Box>

						{/* Task Queue */}
						<Box borderStyle="round" borderColor="red" padding={1}>
							<Box flexDirection="column">
								<Text color="yellow" bold>
									📋 TASK QUEUE
								</Text>
								<Box marginTop={1}>
									{tasks.length > 0 ? (
										tasks.slice(0, 5).map((task) => (
											<Text key={task.task_id}>
												{task.task_name} | {task.priority || "MED"} |{" "}
												{task.status}
											</Text>
										))
									) : (
										<Text dimColor>No active tasks</Text>
									)}
								</Box>
							</Box>
						</Box>
					</Box>

					{/* Right Column */}
					<Box flexDirection="column" width="50%">
						{/* ROI Metrics */}
						<Box
							borderStyle="round"
							borderColor="yellow"
							padding={1}
							marginBottom={1}
						>
							<Box flexDirection="column">
								<Text color="yellow" bold>
									💰 ROI METRICS (24H)
								</Text>
								<Box marginTop={1} flexDirection="column">
									<Text>✅ Tasks: {roi.tasks_completed}</Text>
									<Text>📝 Lines: {roi.lines_delivered.toLocaleString()}</Text>
									<Text>💰 Cost: ${roi.total_cost.toFixed(4)}</Text>
									{roi.lines_per_dollar > 0 && (
										<Text color="green" bold>
											📈 Lines/$: {Math.floor(roi.lines_per_dollar)}
										</Text>
									)}
								</Box>
							</Box>
						</Box>

						{/* Quality Gates */}
						<Box
							borderStyle="round"
							borderColor="yellow"
							padding={1}
							marginBottom={1}
						>
							<Box flexDirection="column">
								<Text color="yellow" bold>
									🎯 QUALITY GATES
								</Text>
								<Box marginTop={1} flexDirection="column">
									<Text>
										✅ Success: {(gates.success_rate * 100).toFixed(1)}%
									</Text>
									<Text>❌ Error: {(gates.error_rate * 100).toFixed(1)}%</Text>
									<Text color={gates.quality_passing ? "green" : "red"} bold>
										{gates.quality_passing ? "✓ PASSING" : "✗ FAILING"}
									</Text>
								</Box>
							</Box>
						</Box>

						{/* Live Events */}
						<Box borderStyle="round" borderColor="yellow" padding={1}>
							<Box flexDirection="column">
								<Text color="yellow" bold>
									📊 LIVE EVENT STREAM
								</Text>
								<Box marginTop={1}>
									{events.length > 0 ? (
										events.map((event) => (
											<Text key={event.timestamp} dimColor>
												[{event.agent_id?.substring(0, 12)}] {event.event_type}
											</Text>
										))
									) : (
										<Text dimColor>Waiting for events...</Text>
									)}
								</Box>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>

			{/* Footer */}
			<Box marginTop={1} justifyContent="center">
				<Text dimColor>
					Help: cat ~/.dev/PICARD_USER_MANUAL.md | Press Ctrl+C to exit
				</Text>
			</Box>
		</Box>
	);
}

// Launch
console.log("🖖 PICARD initializing...\n");

render(<Dashboard />);
