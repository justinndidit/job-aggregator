import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { Job, JobIntent, RemotiveApiResponse } from '../../types.js';

function stripHTML(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export const searchRemotiveTool = createTool({
  id: 'search-remotive',
  description: 'Search remote jobs from Remotive API',
  inputSchema: z.object({
    intent: z.object({
      role: z.string().optional(),
      location: z.array(z.string()).optional(),
    }),
  }),
  outputSchema: z.object({
    jobs: z.array(z.any()),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { intent } = context as { intent: JobIntent };
    const url = new URL('https://remotive.com/api/remote-jobs');

    if (intent.role) {
      url.searchParams.append('search', intent.role);
    }

    if (intent.location && intent.location.length > 0) {
      url.searchParams.append('location', intent.location[0]);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MastraJobAgent/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data = await response.json() as RemotiveApiResponse;

    const jobs: Job[] = data.jobs.map((job) => ({
      id: job.id,
      url: job.url,
      title: job.title,
      companyName: job.company_name,
      companyLogo: job.company_logo,
      category: job.category,
      tags: job.tags,
      jobType: job.job_type,
      location: job.candidate_required_location,
      salary: job.salary,
      excerpt: stripHTML(job.description).substring(0, 200) + '...',
      description: stripHTML(job.description),
      publishedDate: job.publication_date,
      source: 'Remotive',
    }));

    return { jobs };
  },
});