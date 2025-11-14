import { Box, Text } from "ink";
import type { FC } from "react";
import type { DashboardData } from "../types.js";

export const ProjectsView: FC<{ data: DashboardData }> = ({ data }) => {
	const { projects } = data;

	return (
		<Box flexDirection="column" padding={2}>
			<Text color="yellow" bold>
				📁 ALL PROJECTS
			</Text>
			<Box marginTop={1} borderStyle="round" borderColor="red" padding={1}>
				{projects.length > 0 ? (
					<Box flexDirection="column">
						{projects.map((p) => (
							<Box key={p.project_id} marginBottom={1}>
								<Box flexDirection="column">
									<Text color="cyan" bold>
										{p.project_name}
									</Text>
									<Text dimColor>Path: {p.project_path}</Text>
									<Text>
										Status: {p.status} | Phase: {p.phase || "—"} | Agents:{" "}
										{p.active_agents}
									</Text>
									<Text>
										Tasks: {p.total_tasks_completed} | Lines:{" "}
										{p.total_lines_delivered.toLocaleString()} | Cost: $
										{p.total_cost_usd.toFixed(2)}
									</Text>
									{p.lines_per_dollar > 0 && (
										<Text color="green">
											Lines/$: {Math.floor(p.lines_per_dollar)}
										</Text>
									)}
								</Box>
							</Box>
						))}
					</Box>
				) : (
					<Text dimColor>No projects registered</Text>
				)}
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Use: dev deploy --agent ID --platform NAME --project PATH
				</Text>
			</Box>
		</Box>
	);
};
