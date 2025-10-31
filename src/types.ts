export interface JobIntent {
  role?: string;
  location?: string[];
  workType?: string;
  experienceLevel?: string;
}

export interface Job {
  id: string | number;
  url: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  category?: string;
  tags?: string[];
  jobType?: string;
  location: string;
  level?: string;
  salary?: string;
  excerpt?: string;
  description?: string;
  publishedDate: string;
  source: string;
}

// Remotive API Response Types
export interface RemotiveApiResponse {
  'job-count': number;
  'total-job-count': number;
  jobs: RemotiveJobRaw[];
}

export interface RemotiveJobRaw {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

// Jobicy API Response Types
export interface JobicyApiResponse {
  job_count: number;
  jobs: JobicyJobRaw[];
}

export interface JobicyJobRaw {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
}

// A2A Protocol Types
export interface A2ARequest {
  jsonrpc: string;
  method: string;
  params: any;
  id: string;
}

export interface A2AResponse {
  jsonrpc: string;
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface Message {
  role: string;
  parts: Part[];
  metadata?: Record<string, any>;
  messageId: string;
  taskId?: string;
  contextId?: string;
  kind: string;
}

export interface Part {
  kind: string;
  text?: string;
  data?: any;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  state: 'working' | 'completed' | 'failed';
  message?: Message;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  skills: Skill[];
  serviceUrl: string;
}

export interface Skill {
  name: string;
  description: string;
  type: string;
}