import { Box, Text } from "ink";
import type { FC } from "react";
import type { DashboardData } from "../types.js";

export const AgentsView: FC<{ data: DashboardData }> = ({ data }) => {
	const { agents, roi, gates, tasks, events, context } = data;

	return (
		<Box flexDirection="row" padding={1}>
			<Box flexDirection="column" width="50%" marginRight={2}>
				{/* Agents */}
				<Box
					borderStyle="round"
					borderColor="cyan"
					padding={1}
					marginBottom={1}
				>
					<Text color="cyan" bold>
						🤖 AGENT FLEET
					</Text>
					<Box marginTop={1} flexDirection="column">
						{agents.length > 0 ? (
							agents.map((a) => (
								<Text key={a.agent_id}>
									{a.agent_name || a.agent_id} | {a.platform || "—"} |{" "}
									{a.status} | Tasks:{a.active_tasks}
								</Text>
							))
						) : (
							<Text dimColor>No agents</Text>
						)}
					</Box>
				</Box>
				{/* Tasks */}
				<Box borderStyle="round" borderColor="cyan" padding={1}>
					<Text color="cyan" bold>
						📋 TASK QUEUE
					</Text>
					<Box marginTop={1} flexDirection="column">
						{tasks.length > 0 ? (
							tasks.slice(0, 5).map((t) => (
								<Text key={t.task_id}>
									{t.task_name} | {t.priority || "MED"}
								</Text>
							))
						) : (
							<Text dimColor>No tasks</Text>
						)}
					</Box>
				</Box>
			</Box>
			<Box flexDirection="column" width="50%">
				{/* ROI */}
				<Box
					borderStyle="round"
					borderColor="magenta"
					padding={1}
					marginBottom={1}
					height={8}
				>
					<Text color="cyan" bold>
						💰 ROI (24H)
					</Text>
					<Text>Tasks: {roi.tasks_completed}</Text>
					<Text>Lines: {roi.lines_delivered.toLocaleString()}</Text>
					<Text>Cost: ${roi.total_cost.toFixed(4)}</Text>
					{roi.lines_per_dollar > 0 && (
						<Text color="green" bold>
							Lines/$: {Math.floor(roi.lines_per_dollar)}
						</Text>
					)}
				</Box>
				{/* Context */}
				<Box
					borderStyle="round"
					borderColor="cyan"
					padding={1}
					marginBottom={1}
					height={8}
				>
					<Text color="cyan" bold>
						🧠 CONTEXT
					</Text>
					{context.length > 0 ? (
						context.slice(0, 3).map((c) => {
							const pct = c.context_window
								? (c.avg_input / c.context_window) * 100
								: 0;
							const color = pct > 70 ? "red" : pct > 60 ? "yellow" : "green";
							return (
								<Text key={c.agent_id}>
									{c.agent_id.substring(0, 12)} | {pct.toFixed(0)}%{" "}
									<Text color={color}>●</Text>
								</Text>
							);
						})
					) : (
						<Text dimColor>No data</Text>
					)}
				</Box>
				{/* Quality */}
				<Box
					borderStyle="round"
					borderColor="magenta"
					padding={1}
					marginBottom={1}
					height={6}
				>
					<Text color="cyan" bold>
						🎯 QUALITY
					</Text>
					<Text>Success: {(gates.success_rate * 100).toFixed(1)}%</Text>
					<Text>Error: {(gates.error_rate * 100).toFixed(1)}%</Text>
					<Text color={gates.quality_passing ? "green" : "red"} bold>
						{gates.quality_passing ? "✓ PASSING" : "✗ FAILING"}
					</Text>
				</Box>
				{/* Events */}
				<Box borderStyle="round" borderColor="magenta" padding={1}>
					<Text color="cyan" bold>
						📊 EVENTS
					</Text>
					{events.length > 0 ? (
						events.map((e) => (
							<Text key={e.timestamp} dimColor>
								[{e.agent_id.substring(0, 10)}] {e.event_type}
							</Text>
						))
					) : (
						<Text dimColor>Waiting...</Text>
					)}
				</Box>
			</Box>
		</Box>
	);
};
