#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Annanth Aasha Foundation - Universal Learning Experience Reuse and Transformation Engine
========================================================================================
Implements the Master Prompt for AI Agents:
SEARCH -> MATCH -> REUSE -> ADAPT -> COMPOSE -> BUILD NEW

Usage:
    python chapter_transformer_engine.py --report --chapter "Rational Numbers" --grade 8 --subject "Mathematics"
    python chapter_transformer_engine.py --verify
"""

import os
import sys
import json
import argparse
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REGISTRY_FILE = os.path.join(SCRIPT_DIR, 'registry.json')
BENCHMARK_SCRIPT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'benchmarks', 'qa_ltruth_benchmark.js'))

def load_registry():
    with open(REGISTRY_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_match_report(chapter, grade, subject, query=None):
    registry = load_registry()
    print('=' * 80)
    print(f' AASHA FOUNDATION - RESOURCE MATCH REPORT (SECTION 22)')
    print(f' Chapter: {chapter} | Class {grade} | Subject: {subject}')
    print('=' * 80)
    
    matched = []
    for f in registry['foundations']:
        score = 0
        if any(s.lower() in subject.lower() for s in f['subjects']):
            score += 20
        if grade in f['classes']:
            score += 15
        if query and any(query.lower() in m.lower() for m in f['mechanics']):
            score += 35
        if score > 0:
            matched.append((f, score))
            
    matched.sort(key=lambda x: x[1], reverse=True)
    
    print('\nTop Matched Reusable Foundations from Registry:')
    for f, score in matched[:5]:
        mechs = ', '.join(f['mechanics'][:4])
        print(f'  * [{f["id"]}] {f["name"]} (Score: {score}) -> {f["repo"]}')
        print(f'    Mechanics: {mechs}')
        print(f'    Reuse Strategy: {f["reuse_strategy"]}')
    
    print('\nArchitectural Reuse Formula:')
    print('  SEARCH -> MATCH -> REUSE -> ADAPT -> COMPOSE -> ONLY THEN BUILD NEW')
    print('  Target: ~80% Reused Foundations + ~20% Textbook/NCERT Localization')
    print('=' * 80 + '\n')

def run_benchmark():
    if os.path.exists(BENCHMARK_SCRIPT):
        print('Running L-Truth QA Benchmark on generated chapters...')
        res = subprocess.run(['node', BENCHMARK_SCRIPT], cwd=os.path.abspath(os.path.join(SCRIPT_DIR, '..')))
        return res.returncode == 0
    else:
        print('Benchmark script not found:', BENCHMARK_SCRIPT)
        return False

def main():
    parser = argparse.ArgumentParser(description='Aasha Universal Chapter Transformation Engine')
    parser.add_argument('--report', action='store_true', help='Generate Section 22 Resource Match Report')
    parser.add_argument('--chapter', type=str, default='Rational Numbers', help='Chapter name')
    parser.add_argument('--grade', type=int, default=8, help='Grade / Class (1-10)')
    parser.add_argument('--subject', type=str, default='Mathematics', help='Subject domain')
    parser.add_argument('--query', type=str, default='fraction', help='Search query keyword')
    parser.add_argument('--verify', action='store_true', help='Run L-Truth verification benchmark')
    
    args = parser.parse_args()
    
    if args.report:
        generate_match_report(args.chapter, args.grade, args.subject, args.query)
    elif args.verify:
        run_benchmark()
    else:
        generate_match_report(args.chapter, args.grade, args.subject, args.query)
        run_benchmark()

if __name__ == '__main__':
    main()
