import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { mastra } from './mastra/index.js';
import type { A2ARequest, A2AResponse, Task, AgentCard, Message } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4111;
const SERVICE_URL = process.env.SERVICE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(bodyParser.json());

// Task storage
const tasks = new Map<string, Task>();

// Agent Card
const agentCard: AgentCard = {
  name: 'Job Aggregator Agent',
  description: 'AI agent that searches and aggregates remote job listings from multiple sources',
  version: '1.0.0',
  capabilities: ['job_search', 'intent_parsing', 'multi_source_aggregation'],
  skills: [
    {
      name: 'search_jobs',
      description: 'Search remote jobs from Remotive and Jobicy APIs',
      type: 'api_integration',
    },
  ],
  serviceUrl: `${SERVICE_URL}/a2a`,
};

// Agent Card endpoint
app.get('/.well-known/agent.json', (_req, res) => {
  res.json(agentCard);
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: agentCard.version,
    time: new Date().toISOString(),
    sources: ['remotive', 'jobicy'],
  });
});

// A2A endpoint
app.post('/a2a', async (req, res) => {
  const request: A2ARequest = req.body;

  console.log(`Received A2A request: method=${request.method}, id=${request.id}`);

  if (request.method === 'message/send') {
    await handleMessageSend(request, res);
  } else if (request.method === 'tasks/get') {
    handleTasksGet(request, res);
  } else {
    const response: A2AResponse = {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32601,
        message: 'Method not found',
        data: `Unknown method: ${request.method}`,
      },
    };
    res.json(response);
  }
});

async function handleMessageSend(request: A2ARequest, res: express.Response) {
  const message: Message = request.params;

  // Extract query from message parts
  const textPart = message.parts.find(p => p.kind === 'text');
  if (!textPart || !textPart.text) {
    const response: A2AResponse = {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32602,
        message: 'Invalid params',
        data: 'No text content in message',
      },
    };
    res.json(response);
    return;
  }

  const query = textPart.text;
  const taskId = message.taskId || `task_${Date.now()}`;

  // Create working task
  const task: Task = {
    id: taskId,
    state: 'working',
    timestamp: new Date().toISOString(),
    metadata: { query },
  };
  tasks.set(taskId, task);

  // Return immediate response
  const response: A2AResponse = {
    jsonrpc: '2.0',
    id: request.id,
    result: task,
  };
  res.json(response);

  // Process asynchronously
  processJobSearch(taskId, query, message).catch(err => {
    console.error(`Task ${taskId} failed:`, err);
    const errorTask: Task = {
      id: taskId,
      state: 'failed',
      timestamp: new Date().toISOString(),
      message: {
        role: 'agent',
        parts: [{ kind: 'text', text: `Error: ${err.message}` }],
        messageId: `msg_${Date.now()}`,
        taskId,
        kind: 'message',
      },
    };
    tasks.set(taskId, errorTask);
  });
}

async function processJobSearch(taskId: string, query: string, originalMessage: Message) {
  console.log(`Processing job search for task ${taskId}: ${query}`);

  try {
    // Use Mastra agent to search
    const agent = mastra.getAgent('jobAggregator');
    const result = await agent.generate(query);

    const responseText = result.text || 'No results found';

    // Extract job data if available from tool results
    let jobData: any = null;
    if (result.toolResults && result.toolResults.length > 0) {
      jobData = result.toolResults[0];
    }

    // Update task
    const completedTask: Task = {
      id: taskId,
      state: 'completed',
      timestamp: new Date().toISOString(),
      message: {
        role: 'agent',
        parts: [
          { kind: 'text', text: responseText },
          ...(jobData ? [{ kind: 'data', data: jobData }] : []),
        ],
        messageId: `msg_${Date.now()}`,
        taskId,
        contextId: originalMessage.contextId,
        kind: 'message',
      },
      metadata: {
        completed_at: new Date().toISOString(),
      },
    };

    tasks.set(taskId, completedTask);
    console.log(`Task ${taskId} completed`);
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error);
    throw error;
  }
}

function handleTasksGet(request: A2ARequest, res: express.Response) {
  const taskId = request.params.taskId;

  if (!taskId) {
    const response: A2AResponse = {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32602,
        message: 'Invalid params',
        data: 'taskId is required',
      },
    };
    res.json(response);
    return;
  }

  const task = tasks.get(taskId);

  if (!task) {
    const response: A2AResponse = {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32000,
        message: 'Task not found',
        data: `Task ${taskId} does not exist`,
      },
    };
    res.json(response);
    return;
  }

  const response: A2AResponse = {
    jsonrpc: '2.0',
    id: request.id,
    result: task,
  };
  res.json(response);
}

app.listen(PORT, () => {
  console.log(`✅ Job Aggregator Agent running on port ${PORT}`);
  console.log(`🔗 Agent Card: http://localhost:${PORT}/.well-known/agent.json`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🤖 A2A Endpoint: http://localhost:${PORT}/a2a`);
});