import { Box, Text } from "ink";
import type { FC } from "react";

export const HelpModal: FC<{ onClose: () => void }> = () => {
	return (
		<Box
			position="absolute"
			width="100%"
			height="100%"
			justifyContent="center"
			alignItems="center"
		>
			<Box borderStyle="double" borderColor="yellow" padding={2} width={70}>
				<Box flexDirection="column">
					<Text color="yellow" bold>
						🖖 PICARD QUICK REFERENCE
					</Text>
					<Text> </Text>
					<Text bold>Keyboard Controls:</Text>
					<Text> 1 - Agents view (orchestration)</Text>
					<Text> 2 - Projects view (all your projects)</Text>
					<Text> 3 - Loadouts view (agent configurations)</Text>
					<Text> 4 - Protocols view (development standards)</Text>
					<Text> 5 - Hacks view (helpful shortcuts)</Text>
					<Text> h/? - Toggle this help</Text>
					<Text> q/ESC - Quit PICARD</Text>
					<Text> </Text>
					<Text bold>Commands (run in another terminal):</Text>
					<Text dimColor>
						{" "}
						dev deploy --agent ID --platform NAME --project PATH
					</Text>
					<Text dimColor> dev task create --type TYPE --name NAME</Text>
					<Text dimColor> dev task assign --task ID --agent ID</Text>
					<Text dimColor> dev team deploy --manifest FILE</Text>
					<Text> </Text>
					<Text bold>Documentation:</Text>
					<Text dimColor> cat ~/.dev/PICARD_USER_MANUAL.md</Text>
					<Text dimColor> cat ~/.dev/START_HERE.md</Text>
					<Text> </Text>
					<Text color="yellow">Press 'h' to close help</Text>
				</Box>
			</Box>
		</Box>
	);
};
