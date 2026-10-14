/**
 * AASHA AIOS Development Agent — Controlled Command Allowlist Executor
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 2 Bounded Implementation and Verification
 */

import { spawnSync } from 'child_process';
import * as path from 'path';

export interface CommandExecutionOptions {
  workingDirectory: string;
  timeoutMs?: number;
  maxBufferBytes?: number;
  envAllowlist?: Record<string, string>;
  isNetworkAuthorized?: boolean;
  isInstallAuthorized?: boolean;
}

export interface ControlledExecutionResult {
  executable: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  isDenied: boolean;
  denialReason?: string;
}

export class CommandAllowlistExecutor {
  private static readonly ALLOWED_EXECUTABLES = new Set([
    'git',
    'node',
    'npm',
    'npx',
  ]);

  private static readonly PROHIBITED_TOKENS = [
    '&&',
    ';',
    '|',
    '>',
    '<',
    '`',
    '$',
    'rm -rf',
    'remove-item',
    'del /f',
    'format',
    'curl',
    'wget',
    'invoke-webrequest',
  ];

  /**
   * Validates whether an executable and argument list conform to strict security policy.
   */
  public static isCommandPermitted(executable: string, args: string[], options?: CommandExecutionOptions): { permitted: boolean; reason?: string } {
    const execBase = path.basename(executable).toLowerCase().replace(/\.exe$/, '');

    // 1. Executable must be explicitly allowlisted
    if (!this.ALLOWED_EXECUTABLES.has(execBase)) {
      return { permitted: false, reason: `Executable '${execBase}' is not in approved allowlist (${Array.from(this.ALLOWED_EXECUTABLES).join(', ')})` };
    }

    // 2. Check for prohibited shell metacharacters in arguments
    const fullArgString = args.join(' ').toLowerCase();
    for (const token of this.PROHIBITED_TOKENS) {
      if (fullArgString.includes(token)) {
        return { permitted: false, reason: `Command arguments contain prohibited shell metacharacter or destructive token: '${token}'` };
      }
    }

    // 3. Check for unauthorized package installs
    if (execBase === 'npm' && (args.includes('install') || args.includes('i') || args.includes('add')) && !options?.isInstallAuthorized) {
      return { permitted: false, reason: 'Package installation requires explicit human authorization' };
    }

    // 4. Check for unauthorized git pushes
    if (execBase === 'git' && (args.includes('push') || args.includes('remote') && args.includes('add'))) {
      return { permitted: false, reason: 'Git push and remote modifications are strictly restricted' };
    }

    return { permitted: true };
  }

  /**
   * Executes an allowlisted command safely using spawnSync without a shell.
   */
  public static execute(executable: string, args: string[], options: CommandExecutionOptions): ControlledExecutionResult {
    const startTime = Date.now();
    const check = this.isCommandPermitted(executable, args, options);

    if (!check.permitted) {
      return {
        executable,
        args,
        exitCode: 126, // Command invoked cannot execute
        stdout: '',
        stderr: `SECURITY_DENIAL: ${check.reason}`,
        durationMs: 0,
        isDenied: true,
        denialReason: check.reason,
      };
    }

    const timeout = Math.min(options.timeoutMs || 30000, 60000);
    const maxBuffer = options.maxBufferBytes || 1024 * 1024; // 1 MB ceiling

    // Controlled environment: strip private credentials
    const cleanEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      NODE_ENV: 'test',
      SystemRoot: process.env.SystemRoot,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
      ...(options.envAllowlist || {}),
    };

    try {
      const res = spawnSync(executable, args, {
        cwd: path.resolve(options.workingDirectory),
        env: cleanEnv,
        timeout,
        maxBuffer,
        encoding: 'utf8',
        shell: false, // Critical: execute directly without shell interpolation
      });

      return {
        executable,
        args,
        exitCode: res.status ?? (res.error ? 1 : 0),
        stdout: (res.stdout || '').slice(0, 10000), // Excerpt cap
        stderr: (res.stderr || (res.error ? res.error.message : '')).slice(0, 10000),
        durationMs: Date.now() - startTime,
        isDenied: false,
      };
    } catch (err: any) {
      return {
        executable,
        args,
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        durationMs: Date.now() - startTime,
        isDenied: false,
      };
    }
  }
}
