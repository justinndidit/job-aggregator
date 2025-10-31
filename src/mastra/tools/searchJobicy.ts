import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { Job, JobIntent, JobicyApiResponse } from '../../types.js';

function extractTag(role: string): string {
  const roleLower = role.toLowerCase();
  const keywords = [
    'python', 'javascript', 'java', 'go', 'golang', 'rust', 'ruby',
    'php', 'typescript', 'react', 'node', 'nodejs', 'angular', 'vue',
    'ios', 'android', 'swift', 'kotlin', 'devops', 'backend', 'frontend',
  ];

  for (const keyword of keywords) {
    if (roleLower.includes(keyword)) {
      return keyword === 'golang' ? 'go' : keyword;
    }
  }
  return role;
}

function normalizeGeo(location: string): string {
  const geoMap: Record<string, string> = {
    'remote': '',
    'usa': 'usa',
    'us': 'usa',
    'united states': 'usa',
    'canada': 'canada',
    'uk': 'uk',
    'europe': 'europe',
    'asia': 'asia',
  };
  return geoMap[location.toLowerCase()] || location;
}

export const searchJobicyTool = createTool({
  id: 'search-jobicy',
  description: 'Search remote jobs from Jobicy API',
  inputSchema: z.object({
    intent: z.object({
      role: z.string().optional(),
      location: z.array(z.string()).optional(),
      workType: z.string().optional(),
    }),
  }),
  outputSchema: z.object({
    jobs: z.array(z.any()),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { intent } = context as { intent: JobIntent };
    const params = new URLSearchParams();
    params.append('count', '10');

    if (intent.role) {
      const tag = extractTag(intent.role);
      if (tag) params.append('tag', tag);
    }

    if (intent.location && intent.location.length > 0) {
      const geo = normalizeGeo(intent.location[0]);
      if (geo && geo !== 'remote') {
        params.append('geo', geo);
      }
    }

    const response = await fetch(
      `https://jobicy.com/api/v2/remote-jobs?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'MastraJobAgent/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Jobicy API error: ${response.status}`);
    }

    const data = await response.json() as JobicyApiResponse;

    const jobs: Job[] = data.jobs.map((job) => ({
      id: job.id,
      url: job.url,
      title: job.jobTitle,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      tags: job.jobIndustry,
      jobType: job.jobType?.[0],
      location: job.jobGeo,
      level: job.jobLevel,
      excerpt: job.jobExcerpt,
      description: job.jobDescription,
      publishedDate: job.pubDate,
      source: 'Jobicy',
    }));

    return { jobs };
  },
});