import { mockWorkflow } from './mock';
import { executeWorkflow } from './workflow-service';

export default {
  port: 3001,
  fetch: async (req: Request) => {
    const url = new URL(req.url);
    if (url.pathname === '/execute-workflow' && req.method === 'POST') {
      try {
        const { definition, inputs } = await req.json();

        if (!definition || !inputs) {
          return new Response(JSON.stringify({ error: 'Missing definition or inputs' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const output = await executeWorkflow(definition, inputs);
        return new Response(JSON.stringify({ output }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  },

};







setTimeout(() => {
  fetch('http://localhost:3001/execute-workflow', {
    method: 'POST',
    body: JSON.stringify(mockWorkflow)
  }).then(res => res.json()).then(data => console.log(JSON.stringify(data, null, 2)));
}, 1000);

