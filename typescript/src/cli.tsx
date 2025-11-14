#!/usr/bin/env bun
/**
 * 🖖 PICARD - TypeScript + Bun Version
 * Multi-Agent Orchestration Command Center
 */

import { render } from "ink";
import { Dashboard } from "./components/Dashboard.js";

// Launch message
console.log("🖖 PICARD initializing...\n");

// Render dashboard
render(<Dashboard />);
