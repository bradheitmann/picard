import { Box, Text } from "ink";
import type { FC } from "react";
import type { DashboardData } from "../types.js";

export const ProtocolsView: FC<{ data: DashboardData }> = ({ data }) => {
	const { protocols } = data;

	return (
		<Box flexDirection="column" padding={2}>
			<Text color="yellow" bold>
				📋 DEVELOPMENT PROTOCOLS
			</Text>
			<Box marginTop={1} borderStyle="round" borderColor="red" padding={1}>
				{protocols.length > 0 ? (
					<Box flexDirection="column">
						{protocols.map((p) => (
							<Box key={p.protocol_id} marginBottom={1}>
								<Text color="cyan" bold>
									{p.protocol_name} v{p.version}
								</Text>
								<Text dimColor>{p.description}</Text>
								<Text>
									Category: {p.category || "—"} | Applied: {p.times_applied}x
								</Text>
								{p.success_rate !== null && (
									<Text color={p.success_rate > 0.8 ? "green" : "yellow"}>
										Success Rate: {(p.success_rate * 100).toFixed(1)}%
									</Text>
								)}
							</Box>
						))}
					</Box>
				) : (
					<Text dimColor>No protocols loaded</Text>
				)}
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Protocols: MVC, RAD, AGENTS.md Standard, Quality Gates
				</Text>
			</Box>
		</Box>
	);
};
