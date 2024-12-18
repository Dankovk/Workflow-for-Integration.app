import path from 'node:path';
import type { WorkflowDefinition } from './src/core';
import { startWorkflowService } from './src/core';
import { testWorkflow } from './src/test';

const runServer = async () => {
  await startWorkflowService();
  console.log('Server started');
  Bun.serve({
    port: 8080,
    hostname: 'localhost',
    fetch: async (req) => {
      try {
        const url = new URL(req.url);
        console.log('Request received', url.pathname);

        if (url.pathname === '/') {
          console.log('Serving index.html');
          const html = await Bun.file('./public/index.html', {
            type: 'text/html',
            cacheControl: { maxAge: 0 },
          }).text();

          return new Response(html, {
            headers: {
              'Content-Type': 'text/html',
              'Access-Control-Allow-Origin': '*'
            },
          });
        }

        if (url.pathname.startsWith('/workflow')) {
          const workflowData = await req.json() as WorkflowDefinition;
          const result = await testWorkflow(workflowData);
          return new Response(JSON.stringify(result), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
          });
        }

        return new Response('Not Found', { status: 404 });
      } catch (error) {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  });
};

runServer().catch(console.error);