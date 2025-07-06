import type { Tool } from 'ai';
import type { GenericActionCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';
import { WebSearchAdapter } from './tools/web_search';

export type ToolAdapter = (params: ConditionalToolParams) => Promise<Partial<Record<string, Tool>>>;
export const TOOL_ADAPTERS = [WebSearchAdapter];
export const ABILITIES = ['web_search'] as const;
export type AbilityId = (typeof ABILITIES)[number];

export type ConditionalToolParams = {
  ctx: GenericActionCtx<DataModel>;
  enabledTools: AbilityId[];
};

export const getToolkit = async (
  ctx: GenericActionCtx<DataModel>,
  enabledTools: AbilityId[]
): Promise<Record<string, Tool>> => {
  const toolResults = await Promise.all(
    TOOL_ADAPTERS.map(adapter => adapter({ ctx, enabledTools }))
  );

  const tools: Record<string, Tool> = {};
  for (const toolResult of toolResults) {
    for (const [key, value] of Object.entries(toolResult)) {
      if (value) {
        tools[key] = value;
      }
    }
  }

  console.log('tools', Object.keys(tools));
  return tools;
};
