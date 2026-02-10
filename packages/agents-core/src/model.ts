/**
 * Model Layer
 *
 * Isolated model call for Gemini Interactions API.
 */

import { GoogleGenAI } from '@google/genai';
import type { ModelCallConfig, ModelCallResult, Usage } from './types';
import type { AgentEventStream } from './utils/event-stream';

/**
 * Call the Interactions API and push events to stream.
 *
 * @param config - Model call configuration
 * @param stream - Event stream to push events to
 * @returns Model call result
 */
export async function callModel(
  config: ModelCallConfig,
  stream: AgentEventStream
): Promise<ModelCallResult> {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Build tool definitions
  const tools = config.tools?.map((t) => ({
    type: 'function' as const,
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));

  const streamResult = await client.interactions.create({
    model: config.model,
    // biome-ignore lint/suspicious/noExplicitAny: SDK type mismatch
    input: config.input as any,
    previous_interaction_id: config.previousInteractionId,
    tools: tools?.length ? tools : undefined,
    system_instruction: config.systemInstruction,
    stream: true,
    generation_config: {
      thinking_level: 'high',
      thinking_summaries: 'auto',
    },
  });

  let interactionId = config.previousInteractionId || '';
  let usage: Usage = {};
  // biome-ignore lint/suspicious/noExplicitAny: SDK event content varies
  const contentBlocks = new Map<number, any>();
  const endedBlocks = new Set<number>();

  for await (const event of streamResult) {
    // Handle interaction lifecycle
    if (event.event_type === 'interaction.start') {
      interactionId = event.interaction?.id || interactionId;
      stream.push({ type: 'interaction.start', interactionId });
    } else if (event.event_type === 'interaction.complete') {
      interactionId = event.interaction?.id || interactionId;
      if (event.interaction?.usage) {
        usage = event.interaction.usage as Usage;
      }
    }

    // Handle content blocks - translate to our events
    if (event.event_type === 'content.start') {
      const index = event.index ?? 0;
      const content = event.content;
      // Initialize block with type
      contentBlocks.set(index, { type: content?.type, ...content });

      if (content?.type === 'text') {
        stream.push({ type: 'text.start', index });
      }
    } else if (event.event_type === 'content.delta') {
      const index = event.index ?? 0;
      const delta = event.delta;
      let block = contentBlocks.get(index);

      // Initialize block if not exists
      if (!block) {
        block = {};
        contentBlocks.set(index, block);
      }

      if (delta) {
        if (delta.type === 'text') {
          block.type = 'text';
          block.text = (block.text || '') + delta.text;
          stream.push({ type: 'text.delta', index, delta: delta.text as string });
        } else if (delta.type === 'thought_summary') {
          block.type = 'thought';
          if (!block.summary) block.summary = [];
          // Clean the summary: remove markdown headings and normalize whitespace (text only)
          const content = delta.content;
          const cleanedContent =
            content?.type === 'text'
              ? {
                  ...content,
                  text: (content.text || '')
                    .replace(/\*\*[^*]+\*\*/g, '') // Remove **bold headings**
                    .replace(/\s+/g, ' ') // Collapse whitespace
                    .trim(),
                }
              : content;
          block.summary.push(cleanedContent);
          // Emit only the new summary, not the accumulated array
          if (cleanedContent) {
            stream.push({
              type: 'thought.summary',
              summary: cleanedContent as { type: 'text'; text: string },
            });
          }
        } else if (delta.type === 'thought_signature') {
          block.type = 'thought';
          block.signature = delta.signature as string;
          // Signature stays in block for reconstructed interactions, not streamed
        } else if (delta.type === 'function_call') {
          block.type = 'function_call';
          if (delta.name) block.name = delta.name;
          if (delta.id) block.id = delta.id;
          if (delta.arguments) block.arguments = delta.arguments || {};
        }
      }
    } else if (event.event_type === 'content.stop') {
      const index = event.index ?? 0;
      const block = contentBlocks.get(index);

      if (block?.type === 'text' && !endedBlocks.has(index)) {
        stream.push({ type: 'text.end', index, text: block.text as string });
        endedBlocks.add(index);
      }
    }

    // Handle errors
    if (event.event_type === 'error') {
      throw new Error(event.error?.message || 'Unknown error');
    }
  }

  // Build outputs from all accumulated content blocks
  // biome-ignore lint/suspicious/noExplicitAny: SDK output type varies
  const outputs: any[] = [];
  for (const [, block] of contentBlocks) {
    if (block?.type) {
      outputs.push(block);
    }
  }

  return { outputs, interactionId, usage };
}
