#!/usr/bin/env python3
"""
Agent Event Collection Server
Receives events from all agents across all platforms and stores in SQLite
"""

import sqlite3
import json
import sys
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

# Configuration
DB_PATH = Path.home() / ".dev/logs/observability.db"
JSONL_PATH = Path.home() / ".dev/logs/events/global-stream.jsonl"
HOST = "localhost"
PORT = 8765

# Ensure directories exist
JSONL_PATH.parent.mkdir(parents=True, exist_ok=True)

class EventCollector:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.lock = threading.Lock()

    def ingest_event(self, event):
        """Store event in database and JSONL"""
        with self.lock:
            # Append to JSONL (for streaming/tailing)
            with open(JSONL_PATH, 'a') as f:
                f.write(json.dumps(event) + '\n')

            # Store in database
            cursor = self.conn.cursor()

            # Insert into events table
            cursor.execute("""
                INSERT INTO events (
                    event_type, timestamp, agent_id, agent_name, platform,
                    session_id, task_id, project, team_id, metadata_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event.get('type'),
                event.get('timestamp'),
                event.get('agent_id'),
                event.get('agent_name'),
                event.get('platform'),
                event.get('session_id'),
                event.get('task_id'),
                event.get('project'),
                event.get('team_id'),
                json.dumps(event.get('metadata', {}))
            ))

            # Update agents table
            self.update_agent(event)

            # Handle specific event types
            event_type = event.get('type', '')

            if event_type == 'agent.started':
                self.handle_agent_started(event)
            elif event_type == 'agent.stopped':
                self.handle_agent_stopped(event)
            elif event_type == 'task.claimed':
                self.handle_task_claimed(event)
            elif event_type == 'task.completed':
                self.handle_task_completed(event)
            elif event_type == 'task.failed':
                self.handle_task_failed(event)
            elif 'tool' in event_type:
                self.handle_tool_usage(event)
            elif 'token' in event_type:
                self.handle_token_usage(event)

            self.conn.commit()

    def update_agent(self, event):
        """Update or create agent record"""
        cursor = self.conn.cursor()
        agent_id = event.get('agent_id')

        # Check if agent exists
        cursor.execute("SELECT agent_id FROM agents WHERE agent_id = ?", (agent_id,))
        exists = cursor.fetchone()

        if exists:
            cursor.execute("""
                UPDATE agents
                SET last_seen = ?, total_events = total_events + 1,
                    status = CASE WHEN ? = 'agent.stopped' THEN 'inactive' ELSE 'active' END
                WHERE agent_id = ?
            """, (event.get('timestamp'), event.get('type'), agent_id))
        else:
            cursor.execute("""
                INSERT INTO agents (agent_id, agent_name, platform, status, first_seen, last_seen)
                VALUES (?, ?, ?, 'active', ?, ?)
            """, (
                agent_id,
                event.get('agent_name', agent_id),
                event.get('platform', 'unknown'),
                event.get('timestamp'),
                event.get('timestamp')
            ))

    def handle_agent_started(self, event):
        """Handle agent.started event"""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO sessions (session_id, agent_id, project, team_id, started_at, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        """, (
            event.get('session_id'),
            event.get('agent_id'),
            event.get('project'),
            event.get('team_id'),
            event.get('timestamp')
        ))

    def handle_agent_stopped(self, event):
        """Handle agent.stopped event"""
        cursor = self.conn.cursor()
        metadata = event.get('metadata', {})
        cursor.execute("""
            UPDATE sessions
            SET ended_at = ?, duration_ms = ?, status = 'completed',
                tasks_completed = ?, files_modified = ?
            WHERE session_id = ?
        """, (
            event.get('timestamp'),
            metadata.get('duration_ms'),
            metadata.get('tasks_completed', 0),
            metadata.get('files_modified', 0),
            event.get('session_id')
        ))

    def handle_task_claimed(self, event):
        """Handle task.claimed event"""
        cursor = self.conn.cursor()
        metadata = event.get('metadata', {})
        cursor.execute("""
            INSERT INTO tasks (
                task_id, agent_id, session_id, project, team_id,
                task_name, priority, status, claimed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'claimed', ?)
        """, (
            event.get('task_id'),
            event.get('agent_id'),
            event.get('session_id'),
            event.get('project'),
            event.get('team_id'),
            metadata.get('task_name', 'Unknown'),
            metadata.get('priority', 'medium'),
            event.get('timestamp')
        ))

    def handle_task_completed(self, event):
        """Handle task.completed event"""
        cursor = self.conn.cursor()
        metadata = event.get('metadata', {})
        cursor.execute("""
            UPDATE tasks
            SET status = 'completed', completed_at = ?, duration_ms = ?,
                outcome = ?, files_modified = ?, lines_added = ?, tests_added = ?
            WHERE task_id = ?
        """, (
            event.get('timestamp'),
            metadata.get('duration_ms'),
            metadata.get('outcome', 'success'),
            metadata.get('files_modified', 0),
            metadata.get('lines_changed', 0),
            metadata.get('tests_added', 0),
            event.get('task_id')
        ))

        # Update agent stats
        cursor.execute("""
            UPDATE agents
            SET total_tasks_completed = total_tasks_completed + 1
            WHERE agent_id = ?
        """, (event.get('agent_id'),))

    def handle_task_failed(self, event):
        """Handle task.failed event"""
        cursor = self.conn.cursor()
        metadata = event.get('metadata', {})
        cursor.execute("""
            UPDATE tasks
            SET status = 'failed', completed_at = ?, duration_ms = ?,
                outcome = 'failure', error_message = ?
            WHERE task_id = ?
        """, (
            event.get('timestamp'),
            metadata.get('duration_ms'),
            metadata.get('error'),
            event.get('task_id')
        ))

        # Update agent stats
        cursor.execute("""
            UPDATE agents
            SET total_tasks_failed = total_tasks_failed + 1
            WHERE agent_id = ?
        """, (event.get('agent_id'),))

    def handle_tool_usage(self, event):
        """Handle tool usage events"""
        cursor = self.conn.cursor()
        metadata = event.get('metadata', {})
        cursor.execute("""
            INSERT INTO tool_usage (
                timestamp, agent_id, session_id, task_id,
                tool_name, success, duration_ms, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.get('timestamp'),
            event.get('agent_id'),
            event.get('session_id'),
            event.get('task_id'),
            metadata.get('tool_name', event.get('type').split('.')[1]),
            metadata.get('success', True),
            metadata.get('duration_ms'),
            json.dumps(metadata)
        ))

    def handle_token_usage(self, event):
        """Handle token usage events"""
        cursor = self.conn.cursor()
        metadata = event.get('metadata', {})
        cursor.execute("""
            INSERT INTO token_usage (
                timestamp, agent_id, session_id, task_id,
                model, input_tokens, output_tokens, total_tokens,
                cost_usd, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.get('timestamp'),
            event.get('agent_id'),
            event.get('session_id'),
            event.get('task_id'),
            metadata.get('model'),
            metadata.get('input_tokens', 0),
            metadata.get('output_tokens', 0),
            metadata.get('total_tokens', 0),
            metadata.get('cost_usd', 0.0),
            json.dumps(metadata)
        ))

class EventHandler(BaseHTTPRequestHandler):
    collector = None

    def do_POST(self):
        """Handle POST requests with events"""
        if self.path == '/events':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)

            try:
                event = json.loads(body)
                self.collector.ingest_event(event)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"ok"}')
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status":"error", "message":str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        """Handle GET requests for status and recent events"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"healthy"}')
        elif self.path.startswith('/events'):
            # Return recent events
            query = parse_qs(urlparse(self.path).query)
            limit = int(query.get('limit', [100])[0])

            cursor = self.collector.conn.cursor()
            cursor.execute("""
                SELECT event_type, timestamp, agent_id, project, metadata_json
                FROM events
                ORDER BY id DESC
                LIMIT ?
            """, (limit,))

            events = []
            for row in cursor.fetchall():
                events.append({
                    'type': row[0],
                    'timestamp': row[1],
                    'agent_id': row[2],
                    'project': row[3],
                    'metadata': json.loads(row[4]) if row[4] else {}
                })

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(events).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def run_server():
    """Start the event collection server"""
    collector = EventCollector(DB_PATH)
    EventHandler.collector = collector

    server = HTTPServer((HOST, PORT), EventHandler)
    print(f"✓ Event Collection Server running on {HOST}:{PORT}")
    print(f"✓ Database: {DB_PATH}")
    print(f"✓ JSONL Stream: {JSONL_PATH}")
    print()
    print("Endpoints:")
    print(f"  POST http://{HOST}:{PORT}/events      - Ingest events")
    print(f"  GET  http://{HOST}:{PORT}/health      - Health check")
    print(f"  GET  http://{HOST}:{PORT}/events      - Recent events")
    print()
    print("Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")
        collector.conn.close()

if __name__ == '__main__':
    run_server()
