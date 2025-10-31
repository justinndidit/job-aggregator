import { Agent } from '@mastra/core';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { searchJobsTool } from '../tools/searchJobs.js';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export const jobAggregatorAgent = new Agent({
  name: 'Job Aggregator',
  instructions: `You are a helpful job search assistant. When users ask about jobs, use the search-jobs tool to find relevant remote positions from multiple sources.

Format your responses in a friendly, concise way highlighting:
- Job title and company
- Location and salary (if available)
- Key details from the job description

Always include the job URL so users can apply.`,
  model: google('gemini-2.0-flash-exp'),
  tools: {
    searchJobs: searchJobsTool,
  },
});