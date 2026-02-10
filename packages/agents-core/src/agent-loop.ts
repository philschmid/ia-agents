/**
 * Agent Loop
 *
 * Core agentic loop for Gemini Interactions API.
 * Uses EventStream push pattern (pi-ai style).
 */

import { CONFIG } from './config';
import { callModel } from './model';
import type {
  AgentContext,
  AgentLoopConfig,
  AgentTool,
  AgentToolResult,
  FunctionCallContent,
  FunctionResultContent,
  Turn,
  Usage,
} from './types';
import { type AgentEventStream, createAgentEventStream } from './utils/event-stream';

// ============================================================================
// Tool Execution
// ============================================================================

/**
 * Execute tool calls and push events to stream.
 */
async function executeTools(
  toolCalls: FunctionCallContent[],
  tools: AgentTool[],
  stream: AgentEventStream,
  signal?: AbortSignal
): Promise<FunctionResultContent[]> {
  const results: FunctionResultContent[] = [];

  for (const fc of toolCalls) {
    const toolCallId = fc.id || '';
    const toolName = fc.name || '';

    stream.push({
      type: 'tool.start',
      id: toolCallId,
      name: toolName,
      arguments: fc.arguments || {},
    });

    let toolResult: AgentToolResult;

    const tool = tools.find((t) => t.name === fc.name);
    if (!tool) {
      toolResult = {
        result: `Tool ${fc.name} not found`,
        isError: true,
      };
    } else {
      try {
        // Execute with streaming callback
        toolResult = await tool.execute(toolCallId, fc.arguments || {}, signal, (partialResult) => {
          stream.push({
            type: 'tool.delta',
            id: toolCallId,
            name: toolName,
            partialResult,
          });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toolResult = {
          result: `Error: ${message}`,
          isError: true,
        };
      }
    }

    stream.push({
      type: 'tool.end',
      id: toolCallId,
      name: toolName,
      result: toolResult.result,
      isError: toolResult.isError || false,
    });

    // Convert to FunctionResultContent for API
    const functionResult: FunctionResultContent = {
      type: 'function_result',
      call_id: toolCallId,
      name: toolName,
      result: toolResult.result,
      is_error: toolResult.isError || false,
    } as FunctionResultContent;

    results.push(functionResult);
  }

  return results;
}

// ============================================================================
// Main Agent Loop
// ============================================================================

/**
 * Main agentic loop.
 *
 * Returns an EventStream that can be consumed via async iteration.
 * The final result is available via stream.result().
 *
 * @example
 * ```typescript
 * const stream = agentLoop('Hello', { model: 'gemini-2.5-flash' });
 * for await (const event of stream) {
 *   console.log(event.type);
 * }
 * const result = await stream.result();
 * ```
 */
export function agentLoop(input: Turn['content'], config: AgentLoopConfig): AgentEventStream {
  const stream = createAgentEventStream();

  (async () => {
    try {
      const context: AgentContext = {
        interactions: [],
        previousInteractionId: config.previousInteractionId,
        usage: {},
        tools: config.tools || [],
        systemInstruction: config.systemInstruction,
      };

      // Add initial user turn
      context.interactions.push({ role: 'user', content: input });

      stream.push({ type: 'agent.start' });

      await runLoop(context, config, stream);
    } catch (error) {
      // Ensure stream closes on unexpected errors
      stream.push({
        type: 'agent.end',
        interactions: [],
        interactionId: '',
        usage: {},
      });
      stream.end({ interactions: [], interactionId: '', usage: {} });
      throw error;
    }
  })();

  return stream;
}

/**
 * Internal loop logic.
 */
async function runLoop(
  context: AgentContext,
  config: AgentLoopConfig,
  stream: AgentEventStream
): Promise<void> {
  const maxIterations = config.maxIterations ?? CONFIG.maxIterations;
  let iteration = 0;

  while (iteration < maxIterations) {
    // Check for abort before each iteration
    if (config.signal?.aborted) break;
    iteration++;

    // Get latest turn content to send
    const latestTurn = context.interactions.at(-1);
    if (!latestTurn) break;

    // Apply transformContext callback if provided
    if (config.transformContext) {
      const modifications = await config.transformContext(context);
      if (modifications) {
        if (modifications.interactions) context.interactions = modifications.interactions;
        if (modifications.tools) context.tools = modifications.tools;
        if (modifications.systemInstruction)
          context.systemInstruction = modifications.systemInstruction;
      }
    }

    // Call model
    const modelResult = await callModel(
      {
        input: latestTurn.content,
        previousInteractionId: context.previousInteractionId,
        model: config.model,
        tools: context.tools, // Use context.tools (may be modified)
        systemInstruction: context.systemInstruction, // Use context.systemInstruction (may be modified)
      },
      stream
    );

    // Update context
    context.previousInteractionId = modelResult.interactionId;
    aggregateUsage(context.usage, modelResult.usage);

    // Add model turn
    const modelTurn: Turn = { role: 'model', content: modelResult.outputs };
    context.interactions.push(modelTurn);

    // Check for tool calls
    const outputs = modelResult.outputs;
    const outputArray = Array.isArray(outputs) ? outputs : [];
    const toolCalls = outputArray.filter(
      // biome-ignore lint/suspicious/noExplicitAny: SDK output type varies
      (p: any) => p.type === 'function_call'
    ) as FunctionCallContent[];

    if (toolCalls.length > 0) {
      // Execute tools
      const toolResults = await executeTools(toolCalls, context.tools, stream, config.signal);

      // Add tool results as user turn
      context.interactions.push({ role: 'user', content: toolResults });
      stream.push({ type: 'interaction.end', turn: modelTurn });
      continue;
    }

    // Check follow-up queue
    const followUp = config.getFollowUpMessages?.();
    if (followUp && followUp.length > 0) {
      context.interactions.push(...followUp);
      stream.push({ type: 'interaction.end', turn: modelTurn });
      continue;
    }

    // Done
    stream.push({ type: 'interaction.end', turn: modelTurn });
    break;
  }

  stream.push({
    type: 'agent.end',
    interactions: context.interactions,
    interactionId: context.previousInteractionId as string,
    usage: context.usage,
  });
  stream.end({
    interactions: context.interactions,
    interactionId: context.previousInteractionId as string,
    usage: context.usage,
  });
}

/**
 * Aggregate usage statistics.
 */
function aggregateUsage(target: Usage, source: Usage): void {
  if (source.total_input_tokens)
    target.total_input_tokens = (target.total_input_tokens || 0) + source.total_input_tokens;
  if (source.total_output_tokens)
    target.total_output_tokens = (target.total_output_tokens || 0) + source.total_output_tokens;
  if (source.total_tokens) target.total_tokens = (target.total_tokens || 0) + source.total_tokens;
  if (source.total_thought_tokens)
    target.total_thought_tokens = (target.total_thought_tokens || 0) + source.total_thought_tokens;
}
