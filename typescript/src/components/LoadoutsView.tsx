import { Box, Text } from "ink";
import type { FC } from "react";
import type { DashboardData } from "../types.js";

export const LoadoutsView: FC<{ data: DashboardData }> = ({ data }) => {
	return (
		<Box flexDirection="column" padding={2}>
			<Text color="yellow" bold>
				🔧 AGENT LOADOUTS
			</Text>
			<Box marginTop={1} borderStyle="round" borderColor="red" padding={1}>
				{data.loadouts.length > 0 ? (
					<Box flexDirection="column">
						{data.loadouts.map((l) => (
							<Box key={l.loadout_id} marginBottom={1}>
								<Text color="cyan" bold>
									{l.loadout_name}
								</Text>
								<Text>
									Model: {l.model} | Platform: {l.ide_platform || "—"} | Used:{" "}
									{l.times_used}x
								</Text>
								{l.avg_cost_per_task !== null && (
									<Text>Avg Cost: ${l.avg_cost_per_task.toFixed(3)}/task</Text>
								)}
								{l.avg_lines_per_dollar !== null && (
									<Text color="green">
										Efficiency: {Math.floor(l.avg_lines_per_dollar)} lines/$
									</Text>
								)}
								<Text dimColor>
									Observations: {l.total_observations} (
									{l.positive_observations}+ / {l.negative_observations}-)
								</Text>
							</Box>
						))}
					</Box>
				) : (
					<Text dimColor>No loadouts tracked</Text>
				)}
			</Box>
		</Box>
	);
};
