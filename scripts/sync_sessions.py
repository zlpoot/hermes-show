#!/usr/bin/env python3
"""
将 Hermes Agent 的 JSONL 会话数据同步到 SQLite 数据库。

Hermes Agent 使用 JSONL 文件存储会话，而 hermes-show 使用 Prisma/SQLite。
此脚本将 JSONL 数据转换为数据库记录。
"""

import json
import os
import sqlite3
import re
from pathlib import Path
from datetime import datetime
from typing import Optional

def get_hermes_home() -> Path:
    """获取 Hermes 配置目录"""
    return Path(os.environ.get('HERMES_HOME', Path.home() / '.hermes'))

def get_sessions_dir() -> Path:
    """获取会话文件目录"""
    return get_hermes_home() / 'sessions'

def get_db_path() -> Path:
    """获取数据库路径"""
    return get_hermes_home() / 'state.db'

def parse_session_filename(filename: str) -> dict:
    """从 JSONL 文件名解析会话信息"""
    # 格式: 20260424_000440_e5ee13d4.jsonl
    # 或: session_20260423_222631_e969c1.json
    # 或: cron_cron_task_worker_mh7c_20260419_222603.jsonl
    
    result = {
        'id': filename.replace('.jsonl', '').replace('.json', ''),
        'platform': 'cli',
        'started_at': None,
    }
    
    # 提取日期时间
    match = re.search(r'(\d{8})_(\d{6})', filename)
    if match:
        date_str, time_str = match.groups()
        try:
            dt = datetime.strptime(f"{date_str}{time_str}", "%Y%m%d%H%M%S")
            result['started_at'] = dt.timestamp()
        except ValueError:
            pass
    
    # 检测平台
    if filename.startswith('cron_'):
        result['platform'] = 'cron'
    elif 'telegram' in filename.lower():
        result['platform'] = 'telegram'
    elif 'discord' in filename.lower():
        result['platform'] = 'discord'
    
    return result

def extract_title(messages: list) -> Optional[str]:
    """从消息中提取会话标题（使用第一条用户消息的前50字符）"""
    for msg in messages:
        if msg.get('role') == 'user':
            content = msg.get('content', '')
            if content:
                # 清理并截断
                title = content.strip().replace('\n', ' ')[:50]
                if len(content) > 50:
                    title += '...'
                return title
    return None

def count_tokens(messages: list) -> tuple[int, int]:
    """估算 token 数量（简单估算：字符数/4）"""
    input_tokens = 0
    output_tokens = 0
    
    for msg in messages:
        content = msg.get('content', '') or ''
        tokens = len(content) // 4
        
        if msg.get('role') == 'user':
            input_tokens += tokens
        elif msg.get('role') == 'assistant':
            output_tokens += tokens
    
    return input_tokens, output_tokens

def process_jsonl_file(filepath: Path) -> dict:
    """处理单个 JSONL 文件"""
    messages = []
    session_meta = None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            try:
                data = json.loads(line)
                
                if data.get('role') == 'session_meta':
                    session_meta = data
                    # 从 session_meta 提取平台信息
                    if 'platform' in data:
                        platform = data['platform']
                else:
                    messages.append(data)
            except json.JSONDecodeError:
                continue
    
    # 解析文件名获取基本信息
    file_info = parse_session_filename(filepath.name)
    
    # 提取标题
    title = extract_title(messages)
    
    # 计算 tokens
    input_tokens, output_tokens = count_tokens(messages)
    
    return {
        'id': file_info['id'],
        'title': title,
        'platform': file_info['platform'],
        'started_at': file_info['started_at'],
        'messages': messages,
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
    }

def sync_to_database(sessions: list, db_path: Path):
    """将会话数据同步到 SQLite 数据库"""
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # 确保 sessions 表存在
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            source TEXT,
            started_at REAL,
            ended_at REAL,
            input_tokens INTEGER,
            output_tokens INTEGER
        )
    ''')
    
    # 确保 messages 表存在
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            tool_name TEXT,
            timestamp REAL,
            tool_call_id TEXT,
            tool_calls TEXT,
            token_count INTEGER,
            finish_reason TEXT,
            reasoning TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    ''')
    
    # 同步会话
    for session in sessions:
        # 插入或更新 session
        cursor.execute('''
            INSERT OR REPLACE INTO sessions 
            (id, title, source, started_at, ended_at, input_tokens, output_tokens)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            session['id'],
            session['title'],
            session['platform'],
            session['started_at'],
            None,  # ended_at
            session['input_tokens'],
            session['output_tokens'],
        ))
        
        # 删除旧的 messages
        cursor.execute('DELETE FROM messages WHERE session_id = ?', (session['id'],))
        
        # 插入 messages
        for i, msg in enumerate(session['messages']):
            timestamp = msg.get('timestamp')
            if timestamp is None:
                # 使用 started_at + offset
                timestamp = session['started_at'] + i * 0.1 if session['started_at'] else None
            
            cursor.execute('''
                INSERT INTO messages 
                (session_id, role, content, tool_name, timestamp, reasoning)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                session['id'],
                msg.get('role'),
                msg.get('content', '')[:10000] if msg.get('content') else None,  # 限制长度
                msg.get('tool_name'),
                timestamp,
                msg.get('reasoning', '')[:5000] if msg.get('reasoning') else None,
            ))
    
    conn.commit()
    conn.close()

def main():
    """主函数"""
    sessions_dir = get_sessions_dir()
    db_path = get_db_path()
    
    print(f"Sessions directory: {sessions_dir}")
    print(f"Database path: {db_path}")
    
    if not sessions_dir.exists():
        print(f"Error: Sessions directory not found: {sessions_dir}")
        return 1
    
    # 查找所有 JSONL 文件
    jsonl_files = list(sessions_dir.glob('*.jsonl'))
    # 也查找 session_*.json 文件
    jsonl_files.extend(sessions_dir.glob('session_*.json'))
    
    print(f"Found {len(jsonl_files)} session files")
    
    sessions = []
    for filepath in jsonl_files:
        try:
            session = process_jsonl_file(filepath)
            sessions.append(session)
            print(f"  Processed: {filepath.name} ({session['title'] or 'Untitled'})")
        except Exception as e:
            print(f"  Error processing {filepath.name}: {e}")
    
    if not sessions:
        print("No sessions to sync")
        return 0
    
    # 按开始时间排序
    sessions.sort(key=lambda s: s['started_at'] or 0, reverse=True)
    
    # 同步到数据库
    print(f"\nSyncing {len(sessions)} sessions to database...")
    sync_to_database(sessions, db_path)
    print("Done!")
    
    return 0

if __name__ == '__main__':
    exit(main())
