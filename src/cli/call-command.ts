import { createCallResult } from '../result-utils.js';
import { type OutputFormat, printCallOutput, tailLogIfRequested } from './output-utils.js';
import { dumpActiveHandles } from './runtime-debug.js';
import { resolveCallTimeout, withTimeout } from './timeouts.js';

interface CallArgsParseResult {
  selector?: string;
  server?: string;
  tool?: string;
  args: Record<string, unknown>;
  tailLog: boolean;
  output: OutputFormat;
  timeoutMs?: number;
}

function isOutputFormat(value: string): value is OutputFormat {
  return value === 'auto' || value === 'text' || value === 'markdown' || value === 'json' || value === 'raw';
}

export function parseCallArguments(args: string[]): CallArgsParseResult {
  // Maintain backwards compatibility with legacy positional + key=value forms.
  const result: CallArgsParseResult = { args: {}, tailLog: false, output: 'auto' };
  const positional: string[] = [];
  let index = 0;
  while (index < args.length) {
    const token = args[index];
    if (!token) {
      index += 1;
      continue;
    }
    if (token === '--server' || token === '--mcp') {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Flag '${token}' requires a value.`);
      }
      result.server = value;
      index += 2;
      continue;
    }
    if (token === '--tool') {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Flag '${token}' requires a value.`);
      }
      result.tool = value;
      index += 2;
      continue;
    }
    if (token === '--timeout') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--timeout requires a value (milliseconds).');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error('--timeout must be a positive integer (milliseconds).');
      }
      result.timeoutMs = parsed;
      index += 2;
      continue;
    }
    if (token === '--tail-log') {
      result.tailLog = true;
      index += 1;
      continue;
    }
    if (token === '--args') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--args requires a JSON value.');
      }
      try {
        const decoded = JSON.parse(value);
        if (decoded === null || typeof decoded !== 'object' || Array.isArray(decoded)) {
          throw new Error('--args must be a JSON object.');
        }
        Object.assign(result.args, decoded);
      } catch (error) {
        throw new Error(`Unable to parse --args: ${(error as Error).message}`);
      }
      index += 2;
      continue;
    }
    if (token === '--output') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--output requires a format (auto|text|markdown|json|raw).');
      }
      if (!isOutputFormat(value)) {
        throw new Error('--output format must be one of: auto, text, markdown, json, raw.');
      }
      result.output = value;
      index += 2;
      continue;
    }
    positional.push(token);
    index += 1;
  }

  if (positional.length > 0) {
    result.selector = positional.shift();
  }

  const nextPositional = positional[0];
  if (!result.tool && nextPositional !== undefined && !nextPositional.includes('=')) {
    result.tool = positional.shift();
  }

  for (const token of positional) {
    const [key, raw] = token.split('=', 2);
    if (!key || raw === undefined) {
      throw new Error(`Argument '${token}' must be key=value format.`);
    }
    const value = coerceValue(raw);
    if ((key === 'tool' || key === 'command') && !result.tool) {
      if (typeof value !== 'string') {
        throw new Error("Argument 'tool' must be a string value.");
      }
      result.tool = value as string;
      continue;
    }
    if (key === 'server' && !result.server) {
      if (typeof value !== 'string') {
        throw new Error("Argument 'server' must be a string value.");
      }
      result.server = value as string;
      continue;
    }
    result.args[key] = value;
  }
  return result;
}

export async function handleCall(
  runtime: Awaited<ReturnType<typeof import('../runtime.js')['createRuntime']>>,
  args: string[]
): Promise<void> {
  const parsed = parseCallArguments(args);
  const { server, tool } = resolveCallTarget(parsed);

  const timeoutMs = resolveCallTimeout(parsed.timeoutMs);
  let result: unknown;
  try {
    result = await withTimeout(runtime.callTool(server, tool, { args: parsed.args }), timeoutMs);
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      const timeoutDisplay = `${timeoutMs}ms`;
      await runtime.close(server).catch(() => {});
      throw new Error(
        `Call to ${server}.${tool} timed out after ${timeoutDisplay}. Override MCPORTER_CALL_TIMEOUT or pass --timeout to adjust.`
      );
    }
    throw error;
  }

  const wrapped = createCallResult(result);
  printCallOutput(wrapped, result, parsed.output);
  tailLogIfRequested(result, parsed.tailLog);
  dumpActiveHandles('after call (formatted result)');
}

function resolveCallTarget(parsed: CallArgsParseResult): { server: string; tool: string } {
  const selector = parsed.selector;
  let server = parsed.server;
  let tool = parsed.tool;

  if (selector && !server && selector.includes('.')) {
    const [left, right] = selector.split('.', 2);
    server = left;
    tool = right;
  } else if (selector && !server) {
    server = selector;
  } else if (selector && !tool) {
    tool = selector;
  }

  if (!server) {
    throw new Error('Missing server name. Provide it via <server>.<tool> or --server.');
  }
  if (!tool) {
    throw new Error('Missing tool name. Provide it via <server>.<tool> or --tool.');
  }

  return { server, tool };
}

function coerceValue(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === '') {
    return '';
  }
  if (trimmed === 'true' || trimmed === 'false') {
    return trimmed === 'true';
  }
  if (trimmed === 'null' || trimmed === 'none') {
    return null;
  }
  if (!Number.isNaN(Number(trimmed)) && trimmed === `${Number(trimmed)}`) {
    return Number(trimmed);
  }
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}
