import { describe, expect, it } from 'vitest';
import {
  buildExampleValue,
  buildPlaceholder,
  buildToolMetadata,
  extractOptions,
  getDescriptorDefault,
  getDescriptorDescription,
  getEnumValues,
  inferType,
  toCliOption,
  toProxyMethodName,
} from '../src/cli/generate/tools.js';
import type { ServerToolInfo } from '../src/runtime.js';

describe('generate helpers', () => {
  const sampleTool: ServerToolInfo = {
    name: 'add-numbers',
    description: 'Add two numbers',
    inputSchema: {
      type: 'object',
      properties: {
        firstValue: { type: 'number', description: 'First operand', default: 1 },
        mode: { type: 'string', enum: ['fast', 'accurate'] },
        extra_path: { type: 'string' },
      },
      required: ['firstValue', 'mode'],
    },
    outputSchema: undefined,
  };

  it('builds tool metadata', () => {
    const metadata = buildToolMetadata(sampleTool);
    expect(metadata.methodName).toBe('addNumbers');
    expect(metadata.options).toHaveLength(3);
    const first = metadata.options.find((option) => option.property === 'firstValue');
    expect(first).toBeDefined();
    if (first) {
      expect(first.required).toBe(true);
    }
  });

  it('extracts detailed option information', () => {
    const options = extractOptions(sampleTool);
    const first = options.find((option) => option.property === 'firstValue');
    expect(first).toBeDefined();
    if (first) {
      expect(first.placeholder).toBe('<first-value:number>');
      expect(first.exampleValue).toBe('1');
    }

    const mode = options.find((option) => option.property === 'mode');
    expect(mode).toBeDefined();
    if (mode) {
      expect(mode.enumValues).toEqual(['fast', 'accurate']);
      expect(mode.exampleValue).toBe('fast');
    }

    const extra = options.find((option) => option.property === 'extra_path');
    expect(extra).toBeDefined();
    if (extra) {
      expect(extra.placeholder).toBe('<extra-path>');
      expect(extra.exampleValue).toBe('/path/to/file.md');
    }
  });

  it('derives helper metadata', () => {
    expect(getEnumValues({ enum: ['a', 'b', 1] })).toEqual(['a', 'b']);
    expect(getEnumValues({ type: 'array', items: { enum: ['x', 'y'] } })).toEqual(['x', 'y']);
    expect(getEnumValues({ type: 'string' })).toBeUndefined();

    expect(getDescriptorDefault({ default: 'inline' })).toBe('inline');
    expect(getDescriptorDefault({ type: 'array', default: ['alpha'] })).toEqual(['alpha']);

    expect(buildPlaceholder('myPath', 'string', ['s1', 's2'])).toBe('<my-path:s1|s2>');
    expect(buildExampleValue('itemId', 'string', undefined, undefined)).toBe('example-id');
    expect(buildExampleValue('mode', 'string', ['fast'], undefined)).toBe('fast');

    expect(inferType({ type: 'boolean' })).toBe('boolean');
    expect(inferType({})).toBe('unknown');

    expect(getDescriptorDescription({ description: 'hi' })).toBe('hi');
    expect(getDescriptorDescription({})).toBeUndefined();

    expect(toProxyMethodName('some-tool_name')).toBe('someToolName');
    expect(toCliOption('inputValue')).toBe('input-value');
  });
});
