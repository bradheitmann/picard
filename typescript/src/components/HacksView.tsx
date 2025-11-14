import { Box, Text } from "ink";
import type { FC } from "react";
import type { DashboardData } from "../types.js";

export const HacksView: FC<{ data: DashboardData }> = ({ data }) => {
	const { hacks } = data;

	// Group hacks by category
	const categories = [...new Set(hacks.map((h) => h.category))];

	return (
		<Box flexDirection="column" padding={2}>
			<Text color="yellow" bold>
				💡 HELPFUL HACKS & SHORTCUTS
			</Text>
			<Box marginTop={1} borderStyle="round" borderColor="red" padding={1}>
				{hacks.length > 0 ? (
					<Box flexDirection="column">
						{categories.map((category) => {
							const categoryHacks = hacks.filter(
								(h) => h.category === category,
							);
							return (
								<Box key={category} marginBottom={1} flexDirection="column">
									<Text color="cyan" bold>
										{category.toUpperCase()}
									</Text>
									{categoryHacks.map((h) => (
										<Box key={h.hack_id} marginLeft={2} marginBottom={1}>
											<Box flexDirection="column">
												<Text color="yellow">{h.title}</Text>
												<Text dimColor>$ {h.command}</Text>
												{h.description && <Text>{h.description}</Text>}
												<Text dimColor>
													Platform: {h.platform || "any"} | Used: {h.times_used}
													x
												</Text>
											</Box>
										</Box>
									))}
								</Box>
							);
						})}
					</Box>
				) : (
					<Text dimColor>No hacks loaded</Text>
				)}
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Add hacks: sqlite3 ~/.dev/logs/observability.db "INSERT INTO hacks..."
				</Text>
			</Box>
		</Box>
	);
};
