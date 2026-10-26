#!/usr/bin/env python3
"""
AASHA Mem0 Dual-Memory Bridge
Provides dual-write persistence: Mem0 Cloud API (active subscription) + Local offline store.
Ensures zero lock-in, automated snapshot backup, and multi-agent memory partitioning.
"""

import sys
import os
import json
import argparse
import hashlib
from datetime import datetime
from pathlib import Path

# Load environment
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent.parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()
except ImportError:
    pass

LOCAL_STORAGE_DIR = Path(__file__).resolve().parent / 'storage'
LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_DB_FILE = LOCAL_STORAGE_DIR / 'aasha_local_memory.json'

def load_local_db():
    if not LOCAL_DB_FILE.exists():
        return {'memories': []}
    try:
        with open(LOCAL_DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {'memories': []}

def save_local_db(db):
    with open(LOCAL_DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

def get_mem0_client():
    if os.getenv('MEMO0_OFFLINE') == '1' or os.getenv('AASHA_TEST_MODE') == '1' or os.getenv('NODE_ENV') == 'test':
        return None
    api_key = os.getenv('MEMO0_API_KEY')
    if not api_key or api_key == 'YOUR_MEMO0_API_KEY_HERE':
        return None
    try:
        from mem0 import MemoryClient
        return MemoryClient(api_key=api_key)
    except Exception as e:
        sys.stderr.write(f"Mem0 Cloud Init Warning: {e}\n")
        return None

def cmd_add(args):
    content = args.content
    role = args.role
    category = args.category or 'experience'
    metadata = {}
    if args.metadata:
        try:
            metadata = json.loads(args.metadata)
        except Exception:
            metadata = {'raw': args.metadata}

    mem_id = f"{role}_{category}_{hashlib.sha256((content + str(datetime.now())).encode()).hexdigest()[:12]}"
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    memory_record = {
        'id': mem_id,
        'agentRole': role,
        'category': category,
        'content': content,
        'metadata': metadata,
        'timestamp': timestamp
    }

    # 1. Write to local database (Always reliable)
    db = load_local_db()
    db['memories'].append(memory_record)
    save_local_db(db)

    # 2. Write to Mem0 Cloud API if configured (Dual-write)
    cloud_synced = False
    client = get_mem0_client()
    if client:
        try:
            messages = [{'role': 'user', 'content': f"[{role} - {category}]: {content}"}]
            client.add(messages, user_id=f"aasha_{role.lower()}", metadata={'category': category, 'local_id': mem_id, **metadata})
            cloud_synced = True
        except Exception as e:
            sys.stderr.write(f"Mem0 Cloud sync error: {e}\n")

    result = {
        'status': 'success',
        'record': memory_record,
        'cloud_synced': cloud_synced
    }
    print(json.dumps(result, indent=2))

def cmd_search(args):
    query = args.query
    role = args.role
    limit = args.limit or 5

    # If Mem0 Cloud is available, try cloud search first
    client = get_mem0_client()
    cloud_results = []
    if client:
        try:
            user_id = f"aasha_{role.lower()}" if role else None
            res = client.search(query, user_id=user_id)
            if res and isinstance(res, list):
                cloud_results = res[:limit]
        except Exception as e:
            sys.stderr.write(f"Mem0 Cloud search warning: {e}\n")

    # Fallback / Local semantic fuzzy search
    db = load_local_db()
    candidates = db.get('memories', [])
    if role:
        candidates = [m for m in candidates if m.get('agentRole') == role]

    scored = []
    query_words = set(query.lower().split())
    for item in candidates:
        text = (item.get('content', '') + ' ' + json.dumps(item.get('metadata', {}))).lower()
        overlap = sum(1 for w in query_words if w in text)
        score = overlap / max(len(query_words), 1)
        if score > 0:
            scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    local_matches = [item for score, item in scored[:limit]]

    print(json.dumps({
        'status': 'success',
        'query': query,
        'cloud_results': cloud_results,
        'local_results': local_matches,
        'total_local_candidates': len(candidates)
    }, indent=2))

def cmd_export(args):
    output_path = Path(args.output) if args.output else LOCAL_STORAGE_DIR / f"aasha_memory_snapshot_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    db = load_local_db()
    memories = db.get('memories', [])
    
    checksum = hashlib.sha256(json.dumps(memories, sort_keys=True).encode()).hexdigest()
    snapshot = {
        'exportedAt': datetime.utcnow().isoformat() + 'Z',
        'totalMemories': len(memories),
        'memories': memories,
        'checksum': checksum
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)

    print(json.dumps({
        'status': 'success',
        'exported_to': str(output_path),
        'total_memories': len(memories),
        'checksum': checksum
    }, indent=2))

def cmd_health(args):
    client = get_mem0_client()
    db = load_local_db()
    print(json.dumps({
        'status': 'healthy',
        'cloud_available': client is not None,
        'local_db_exists': LOCAL_DB_FILE.exists(),
        'total_local_memories': len(db.get('memories', [])),
        'storage_path': str(LOCAL_DB_FILE)
    }, indent=2))

def main():
    parser = argparse.ArgumentParser(description='AASHA Mem0 Dual-Memory Bridge')
    subparsers = parser.add_subparsers(dest='command')

    add_parser = subparsers.add_parser('add')
    add_parser.add_argument('--role', required=True, help='Agent role')
    add_parser.add_argument('--content', required=True, help='Memory content')
    add_parser.add_argument('--category', default='experience', help='Memory category')
    add_parser.add_argument('--metadata', default=None, help='JSON metadata string')

    search_parser = subparsers.add_parser('search')
    search_parser.add_argument('--query', required=True, help='Search query')
    search_parser.add_argument('--role', default=None, help='Filter by agent role')
    search_parser.add_argument('--limit', type=int, default=5, help='Max items')

    export_parser = subparsers.add_parser('export')
    export_parser.add_argument('--output', default=None, help='Output path')

    subparsers.add_parser('health')

    args = parser.parse_args()
    if args.command == 'add':
        cmd_add(args)
    elif args.command == 'search':
        cmd_search(args)
    elif args.command == 'export':
        cmd_export(args)
    elif args.command == 'health':
        cmd_health(args)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()