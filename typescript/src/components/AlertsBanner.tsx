import { Box, Text } from "ink";
import type { FC } from "react";
import type { ContextUsage, QualityGates } from "../types.js";

interface AlertsBannerProps {
	gates: QualityGates;
	context: ContextUsage[];
}

export const AlertsBanner: FC<AlertsBannerProps> = ({ gates, context }) => {
	const alerts: string[] = [];

	// Quality gate failures
	if (!gates.quality_passing) {
		alerts.push("🔴 QUALITY GATES FAILING");
	}

	// High error rate
	if (gates.error_rate > 0.2) {
		alerts.push("⚠️  HIGH ERROR RATE");
	}

	// Context overload
	const highContext = context.filter((c) => {
		const pct = c.context_window ? (c.avg_input / c.context_window) * 100 : 0;
		return pct > 70;
	});

	if (highContext.length > 0) {
		alerts.push(`🧠 CONTEXT OVERLOAD (${highContext.length} agents)`);
	}

	if (alerts.length === 0) {
		return null;
	}

	return (
		<Box borderStyle="round" borderColor="red" padding={1} marginBottom={1}>
			<Box flexDirection="column">
				<Text color="red" bold>
					🚨 ALERTS ({alerts.length})
				</Text>
				{alerts.map((alert) => (
					<Text key={alert} color="red">
						{alert}
					</Text>
				))}
			</Box>
		</Box>
	);
};
