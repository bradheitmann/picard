/**
 * Main PICARD Dashboard Component
 * Multi-tab interface with full navigation
 */

import { Box, Text, useInput } from "ink";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { PicardDB } from "../db.js";
import type { DashboardData } from "../types.js";
import { AgentsView } from "./AgentsView.js";
import { HelpModal } from "./HelpModal.js";
import { LoadoutsView } from "./LoadoutsView.js";
import { ProjectsView } from "./ProjectsView.js";

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

type View = "agents" | "projects" | "loadouts" | "protocols" | "hacks";

export const Dashboard: FC = () => {
	const [currentView, setCurrentView] = useState<View>("agents");
	const [showHelp, setShowHelp] = useState(false);
	const [data, setData] = useState<DashboardData | null>(null);
	const db = new PicardDB();

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
			{/* Header */}
			<Box borderStyle="double" borderColor="red" padding={1}>
				<Text color="red" bold>
					{BANNER}
				</Text>
			</Box>

			{/* Tab Bar */}
			<Box marginTop={1} marginBottom={1}>
				<Text>
					[
					<Text
						color={currentView === "agents" ? "yellow" : "dim"}
						bold={currentView === "agents"}
					>
						1:Agents
					</Text>
					] [
					<Text
						color={currentView === "projects" ? "yellow" : "dim"}
						bold={currentView === "projects"}
					>
						2:Projects
					</Text>
					] [
					<Text
						color={currentView === "loadouts" ? "yellow" : "dim"}
						bold={currentView === "loadouts"}
					>
						3:Loadouts
					</Text>
					] [
					<Text
						color={currentView === "protocols" ? "yellow" : "dim"}
						bold={currentView === "protocols"}
					>
						4:Protocols
					</Text>
					] [
					<Text
						color={currentView === "hacks" ? "yellow" : "dim"}
						bold={currentView === "hacks"}
					>
						5:Hacks
					</Text>
					] [<Text dimColor>h:Help</Text>] [<Text dimColor>q:Quit</Text>]
				</Text>
			</Box>

			{/* Content */}
			{currentView === "agents" && <AgentsView data={data} />}
			{currentView === "projects" && <ProjectsView data={data} />}
			{currentView === "loadouts" && <LoadoutsView data={data} />}
			{currentView === "protocols" && (
				<Box padding={2}>
					<Text color="yellow">Protocols view coming soon...</Text>
				</Box>
			)}
			{currentView === "hacks" && (
				<Box padding={2}>
					<Text color="yellow">Hacks view coming soon...</Text>
				</Box>
			)}

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
