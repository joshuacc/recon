import { describe, it, expect, vi } from 'vitest';
import { FunctionAgent } from './functionAgent';

describe('FunctionAgent', () => {
  it('should gather information from a single function', async () => {
    const mockFn = vi.fn().mockResolvedValue([
      {
        tag: 'test',
        attrs: {},
        content: 'Test content',
      },
    ]);
    const agent = new FunctionAgent();
    const result = await agent.gather(mockFn);
    expect(result).toEqual([
      {
        tag: 'test',
        attrs: {},
        content: 'Test content',
      },
    ]);
  });

  it('should gather information from multiple functions', async () => {
    const mockFn1 = vi.fn().mockResolvedValue([
      {
        tag: 'test1',
        attrs: {},
        content: 'Test content 1',
      },
    ]);
    const mockFn2 = vi.fn().mockResolvedValue([
      {
        tag: 'test2',
        attrs: {},
        content: 'Test content 2',
      },
    ]);
    const agent = new FunctionAgent();
    const result = await agent.gather([mockFn1, mockFn2]);
    expect(result).toEqual([
      {
        tag: 'test1',
        attrs: {},
        content: 'Test content 1',
      },
      {
        tag: 'test2',
        attrs: {},
        content: 'Test content 2',
      },
    ]);
  });

  it('should throw error when function does not return an array', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      tag: 'test',
      attrs: {},
      content: 'Test content',
    });
    const agent = new FunctionAgent();
    await expect(agent.gather(mockFn)).rejects.toThrow(
      'Function must return an array of GatheredInformation objects'
    );
  });

  it('should throw error when function returns an array with invalid objects', async () => {
    const mockFn = vi.fn().mockResolvedValue([{
      incorrect: 'object',
    }]);
    const agent = new FunctionAgent();
    await expect(agent.gather(mockFn)).rejects.toThrow(
      'Function must return an array of GatheredInformation objects'
    );
  });

  it('should throw error when an invalid function is provided', async () => {
    const agent = new FunctionAgent();
    await expect(agent.gather([1 as any])).rejects.toThrow(
      'Invalid function provided'
    );
  });
});

