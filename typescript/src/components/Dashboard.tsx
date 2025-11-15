/**
 * Main PICARD Dashboard Component
 * Multi-tab interface with full navigation
 */

import { Box, Text, useInput } from "ink";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { PicardDB } from "../db.js";
import type { DashboardData } from "../types.js";
import { AgentsView } from "./AgentsView.js";
import { AlertsBanner } from "./AlertsBanner.js";
import { HacksView } from "./HacksView.js";
import { HelpModal } from "./HelpModal.js";
import { LoadoutsView } from "./LoadoutsView.js";
import { ProjectsView } from "./ProjectsView.js";
import { ProtocolsView } from "./ProtocolsView.js";

// Gradient logo parts (cyan → magenta → yellow gradient)
const LOGO_LINE1 = "    ██████╗ ██╗ ██████╗ █████╗ ██████╗ ██████╗";
const LOGO_LINE2 = "    ██╔══██╗██║██╔════╝██╔══██╗██╔══██╗██╔══██╗";
const LOGO_LINE3 = "    ██████╔╝██║██║     ███████║██████╔╝██║  ██║";
const LOGO_LINE4 = "    ██╔═══╝ ██║██║     ██╔══██║██╔══██╗██║  ██║";
const LOGO_LINE5 = "    ██║     ██║╚██████╗██║  ██║██║  ██║██████╔╝";
const LOGO_LINE6 = "    ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝";

type View = "agents" | "projects" | "loadouts" | "protocols" | "hacks";

export const Dashboard: FC = () => {
	const [currentView, setCurrentView] = useState<View>("agents");
	const [showHelp, setShowHelp] = useState(false);
	const [data, setData] = useState<DashboardData | null>(null);

	// CRITICAL FIX: Create db instance once using useMemo (stable reference)
	const db = useMemo(() => new PicardDB(), []);

	// Keyboard input handling
	useInput((input, key) => {
		if (input === "h" || input === "?") {
			setShowHelp(!showHelp);
		} else if (input === "q" || key.escape) {
			process.exit(0);
		} else if (input === "1") {
			setCurrentView("agents");
		} else if (input === "2") {
			setCurrentView("projects");
		} else if (input === "3") {
			setCurrentView("loadouts");
		} else if (input === "4") {
			setCurrentView("protocols");
		} else if (input === "5") {
			setCurrentView("hacks");
		}
	});

	// Data fetching
	useEffect(() => {
		const updateData = () => {
			try {
				setData({
					agents: db.getActiveAgents(),
					roi: db.getROIMetrics(),
					gates: db.getQualityGates(),
					tasks: db.getActiveTasks(),
					events: db.getRecentEvents(5),
					context: db.getContextUsage(),
					teams: db.getTeamPerformance(),
					projects: db.getProjects(),
					loadouts: db.getLoadouts(),
					protocols: db.getProtocols(),
					hacks: db.getHacks(),
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
	}, [db]);

	if (!data) {
		return (
			<Box flexDirection="column">
				<Text color="red" bold>
					🖖 PICARD initializing...
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			{/* Header - Cyberpunk Gradient Logo */}
			<Box borderStyle="double" borderColor="cyan" padding={1}>
				<Box flexDirection="column" alignItems="center">
					<Text color="cyan" bold>
						{LOGO_LINE1}
					</Text>
					<Text color="blue" bold>
						{LOGO_LINE2}
					</Text>
					<Text color="magenta" bold>
						{LOGO_LINE3}
					</Text>
					<Text color="brightMagenta" bold>
						{LOGO_LINE4}
					</Text>
					<Text color="yellow" bold>
						{LOGO_LINE5}
					</Text>
					<Text color="green" bold>
						{LOGO_LINE6}
					</Text>
					<Text> </Text>
					<Text color="cyan" italic>
						🖖 Project Intelligence, Coordination, And Resource Deployment 🖖
					</Text>
					<Text color="magenta" italic>
						"Make It So"
					</Text>
				</Box>
			</Box>

			{/* Alerts */}
			<AlertsBanner gates={data.gates} context={data.context} />

			{/* Tab Bar - Cyberpunk Neon */}
			<Box marginTop={1} marginBottom={1}>
				<Box flexDirection="row" gap={1}>
					<Text color="cyan">[</Text>
					<Text
						color={currentView === "agents" ? "cyan" : "dim"}
						bold={currentView === "agents"}
					>
						1:Agents
					</Text>
					<Text color="cyan">] [</Text>
					<Text
						color={currentView === "projects" ? "blue" : "dim"}
						bold={currentView === "projects"}
					>
						2:Projects
					</Text>
					<Text color="cyan">] [</Text>
					<Text
						color={currentView === "loadouts" ? "magenta" : "dim"}
						bold={currentView === "loadouts"}
					>
						3:Loadouts
					</Text>
					<Text color="cyan">] [</Text>
					<Text
						color={currentView === "protocols" ? "yellow" : "dim"}
						bold={currentView === "protocols"}
					>
						4:Protocols
					</Text>
					<Text color="cyan">] [</Text>
					<Text
						color={currentView === "hacks" ? "green" : "dim"}
						bold={currentView === "hacks"}
					>
						5:Hacks
					</Text>
					<Text color="cyan">] [</Text>
					<Text color="brightMagenta">h:Help</Text>
					<Text color="cyan">] [</Text>
					<Text color="red">q:Quit</Text>
					<Text color="cyan">]</Text>
				</Box>
			</Box>

			{/* Content */}
			{currentView === "agents" && <AgentsView data={data} />}
			{currentView === "projects" && <ProjectsView data={data} />}
			{currentView === "loadouts" && <LoadoutsView data={data} />}
			{currentView === "protocols" && <ProtocolsView data={data} />}
			{currentView === "hacks" && <HacksView data={data} />}

			{/* Help Modal */}
			{showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

			{/* Footer */}
			<Box marginTop={1} justifyContent="center">
				<Text dimColor>
					Last Update: {new Date().toLocaleTimeString()} | Press 'h' for help |
					'q' to quit
				</Text>
			</Box>
		</Box>
	);
};
