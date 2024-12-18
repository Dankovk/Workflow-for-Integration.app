import type { Workflow } from './actions';
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const mockWorkflow: Workflow = {
  steps: [
    {
      id: "step1",
      uuid: uuid(),
      is_first_step: true,
      action: {
        action_type: "http_request" as const,
        method: "GET" as const,
        url: "http://localhost:3000/api/get-bitcoin-price",
        headers: {
          "Accept": "application/json"
        },
        body: "",
        next_step_id: "step2"
      }
    },
    {
      id: "step2",
      uuid: uuid(),
      action: {
        action_type: "function_call" as const,
        code: `
          const data =  input;
          return data.price > 30000;
        `,
        returns: "boolean" as const,
        success_next_step_id: "step3",
        failure_next_step_id: "step4"
      }
    },
    {
      id: "step3",
      uuid: uuid(),
      is_last_step: true,
      action: {
        action_type: "http_request" as const,
        method: "POST" as const,
        url: "http://localhost:3000/api/post-somewhere",
        headers: {
          "Accept": "application/json"
        },
        body: JSON.stringify({
          price: 30000,
          timestamp: new Date().toISOString()
        }),
        success_next_step_id: 'step4',
        failure_next_step_id: 'step4'
      }
    },
    {
      id: "step4",
      is_last_step: true,
      uuid: uuid(),
      action: {
        action_type: "http_request" as const,
        method: "POST" as const,
        url: "http://localhost:3000/api/post-somewhere",
        headers: {
          "Accept": "application/json"
        },
        body: '',
        next_step_id: "step5"
      }
    },
    {
      id: "step5",
      is_last_step: true,
      action: {
        action_type: "http_request" as const,
        method: "POST" as const,
        url: "http://localhost:3000/api/post-somewhere",
        headers: {
          "Accept": "application/json"
        },
        body: ""
      }
    }
  ]
};





