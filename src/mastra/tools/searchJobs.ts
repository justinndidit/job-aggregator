import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { Job, JobIntent } from '../../types.js';
import { searchRemotiveTool } from './searchRemotive.js';
import { searchJobicyTool } from './searchJobicy.js';

export const searchJobsTool = createTool({
  id: 'search-jobs',
  description: 'Search remote jobs from multiple sources (Remotive and Jobicy)',
  inputSchema: z.object({
    query: z.string().describe('Natural language job search query'),
  }),
  outputSchema: z.object({
    jobs: z.array(z.any()),
    intent: z.object({
      role: z.string().optional(),
      location: z.array(z.string()).optional(),
      workType: z.string().optional(),
      experienceLevel: z.string().optional(),
    }),
    summary: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { query } = context as { query: string };

    // Simple keyword-based intent extraction
    const queryLower = query.toLowerCase();

    // Extract role
    let role: string | undefined;
    const roleKeywords = ['python', 'javascript', 'java', 'go', 'golang', 'rust', 'ruby', 'php', 'typescript', 'react', 'node', 'angular', 'vue', 'devops', 'backend', 'frontend'];
    for (const keyword of roleKeywords) {
      if (queryLower.includes(keyword)) {
        role = keyword;
        break;
      }
    }

    // Extract location
    const location: string[] = [];
    const locationKeywords = ['canada', 'usa', 'us', 'europe', 'uk', 'asia', 'remote'];
    for (const loc of locationKeywords) {
      if (queryLower.includes(loc)) {
        location.push(loc);
        break;
      }
    }

    const intent: JobIntent = {
      role,
      location: location.length > 0 ? location : undefined,
    };

    // Search both sources in parallel
    const [remotiveResult, jobicyResult] = await Promise.allSettled([
      searchRemotiveTool.execute({
        context: { intent },
        runtimeContext
      }),
      searchJobicyTool.execute({
        context: { intent },
        runtimeContext
      }),
    ]);

    const allJobs: Job[] = [];

    if (remotiveResult.status === 'fulfilled') {
      allJobs.push(...remotiveResult.value.jobs);
    }

    if (jobicyResult.status === 'fulfilled') {
      allJobs.push(...jobicyResult.value.jobs);
    }

    const summary = `Found ${allJobs.length} remote jobs${role ? ` for ${role}` : ''}${location.length > 0 ? ` in ${location.join(', ')}` : ''}`;

    return {
      jobs: allJobs,
      intent,
      summary
    };
  },
});