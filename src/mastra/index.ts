import { Mastra } from '@mastra/core';
import { jobAggregatorAgent } from './agents/jobAggregator.js';

export const mastra = new Mastra({
  agents: { jobAggregator: jobAggregatorAgent },
  // Explicitly disable storage to prevent libsql bundling
  storage: undefined,
});