#!/usr/bin/env python3
"""
AASHA SQLite & Graphify Knowledge Graph Bridge
Provides an embedded, zero-dependency knowledge graph with native Graphify interoperability.
Tracks NCERT concepts, prerequisites, misconceptions, and AASHA pedagogical rules.
"""

import sys
import os
import json
import sqlite3
import argparse
import base64
from pathlib import Path
from datetime import datetime

STORAGE_DIR = Path(__file__).resolve().parent / 'storage'
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
GRAPH_DB_FILE = STORAGE_DIR / 'aasha_graph.db'

def parse_flexible_json(val):
    if not val:
        return {}
    if isinstance(val, dict):
        return val
    try:
        return json.loads(val)
    except Exception:
        pass
    try:
        # Check if base64 encoded
        decoded = base64.b64decode(val).decode('utf-8')
        return json.loads(decoded)
    except Exception:
        pass
    try:
        # Try replacing single quotes
        fixed = val.replace("'", '"')
        return json.loads(fixed)
    except Exception:
        return {'raw': val}

def get_db():
    conn = sqlite3.connect(str(GRAPH_DB_FILE))
    conn.row_factory = sqlite3.Row
    with conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                properties TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS edges (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                target TEXT NOT NULL,
                relation TEXT NOT NULL,
                properties TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (source) REFERENCES nodes(id),
                FOREIGN KEY (target) REFERENCES nodes(id)
            )
        ''')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_edges_rel ON edges(relation)')
    return conn

def cmd_add_node(args):
    props = parse_flexible_json(args.properties)
    now = datetime.utcnow().isoformat() + 'Z'
    conn = get_db()
    with conn:
        conn.execute(
            'INSERT OR REPLACE INTO nodes (id, label, properties, created_at) VALUES (?, ?, ?, ?)',
            (args.id, args.label, json.dumps(props), now)
        )
    print(json.dumps({'status': 'success', 'node_id': args.id}))

def cmd_add_edge(args):
    props = parse_flexible_json(args.properties)
    now = datetime.utcnow().isoformat() + 'Z'
    edge_id = args.id or f"{args.source}_{args.relation}_{args.target}"
    conn = get_db()
    with conn:
        conn.execute(
            'INSERT OR REPLACE INTO edges (id, source, target, relation, properties, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            (edge_id, args.source, args.target, args.relation, json.dumps(props), now)
        )
    print(json.dumps({'status': 'success', 'edge_id': edge_id}))

def cmd_prerequisites(args):
    conn = get_db()
    cursor = conn.execute('''
        SELECT n.id, n.label, n.properties
        FROM edges e
        JOIN nodes n ON e.target = n.id
        WHERE e.source = ? AND e.relation = 'REQUIRES_PREREQUISITE'
    ''', (args.concept_id,))
    results = [{'id': r['id'], 'label': r['label'], 'properties': json.loads(r['properties'])} for r in cursor.fetchall()]
    print(json.dumps({'status': 'success', 'concept_id': args.concept_id, 'prerequisites': results}, indent=2))

def cmd_misconceptions(args):
    conn = get_db()
    cursor = conn.execute('''
        SELECT n.id, n.label, n.properties
        FROM edges e
        JOIN nodes n ON e.target = n.id
        WHERE e.source = ? AND e.relation = 'EXPOSES_MISCONCEPTION'
    ''', (args.concept_id,))
    results = [{'id': r['id'], 'label': r['label'], 'properties': json.loads(r['properties'])} for r in cursor.fetchall()]
    print(json.dumps({'status': 'success', 'concept_id': args.concept_id, 'misconceptions': results}, indent=2))

def cmd_rules_for_agent(args):
    conn = get_db()
    cursor = conn.execute('''
        SELECT n.id, n.label, n.properties
        FROM edges e
        JOIN nodes n ON e.source = n.id
        WHERE e.target = ? AND e.relation = 'ENFORCES_RULE'
    ''', (args.agent_role,))
    results = [{'id': r['id'], 'label': r['label'], 'properties': json.loads(r['properties'])} for r in cursor.fetchall()]
    print(json.dumps({'status': 'success', 'agent_role': args.agent_role, 'rules': results}, indent=2))

def cmd_export(args):
    conn = get_db()
    nodes = [{'id': r['id'], 'label': r['label'], 'properties': json.loads(r['properties'])} for r in conn.execute('SELECT * FROM nodes')]
    edges = [{'id': r['id'], 'source': r['source'], 'target': r['target'], 'relation': r['relation'], 'properties': json.loads(r['properties'])} for r in conn.execute('SELECT * FROM edges')]
    output_data = {'nodes': nodes, 'edges': edges, 'totalNodes': len(nodes), 'totalEdges': len(edges)}
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
    print(json.dumps(output_data, indent=2))

def main():
    parser = argparse.ArgumentParser(description='AASHA SQLite Graph Bridge')
    sub = parser.add_subparsers(dest='command')

    node_p = sub.add_parser('add-node')
    node_p.add_argument('--id', required=True)
    node_p.add_argument('--label', required=True)
    node_p.add_argument('--properties', default='{}')

    edge_p = sub.add_parser('add-edge')
    edge_p.add_argument('--source', required=True)
    edge_p.add_argument('--target', required=True)
    edge_p.add_argument('--relation', required=True)
    edge_p.add_argument('--id', default=None)
    edge_p.add_argument('--properties', default='{}')

    prereq_p = sub.add_parser('prerequisites')
    prereq_p.add_argument('--concept-id', required=True)

    misc_p = sub.add_parser('misconceptions')
    misc_p.add_argument('--concept-id', required=True)

    rule_p = sub.add_parser('rules-for-agent')
    rule_p.add_argument('--agent-role', required=True)

    exp_p = sub.add_parser('export')
    exp_p.add_argument('--output', default=None)

    args = parser.parse_args()
    if args.command == 'add-node':
        cmd_add_node(args)
    elif args.command == 'add-edge':
        cmd_add_edge(args)
    elif args.command == 'prerequisites':
        cmd_prerequisites(args)
    elif args.command == 'misconceptions':
        cmd_misconceptions(args)
    elif args.command == 'rules-for-agent':
        cmd_rules_for_agent(args)
    elif args.command == 'export':
        cmd_export(args)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()