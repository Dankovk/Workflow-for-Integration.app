import type { StepType, WorkflowDefinition } from './core';

export const mockSteps: StepType[] = [
  {
    id: 'step1',
    name: 'Fetch Bitcoin Rate',
    type: 'action',
    startStep: true,
    action: {
      type: 'FETCH',
      url: 'http://localhost:3001/bitcoin-rate',
      method: 'GET',
      nextStepId: 'step2'
    }
  },
  {
    id: 'step2',
    name: 'Check Current Balance',
    type: 'action',

    action: {
      type: 'FETCH',
      url: 'http://localhost:3001/current-balance',
      method: 'POST',
      nextStepId: 'step3'
    }
  },
  {
    id: 'step3',
    name: 'Check If Balance Sufficient',
    type: 'condition',


    logic: {
      type: 'GREATER_THAN',
      operands: {
        left: '10000',
        right: '5000'
      },
      conditionMetNextStepId: 'step4',
      conditionFailedNextStepId: 'step5'
    }
  },
  {
    id: 'step4',
    name: 'Process High Balance',
    type: 'action',

    action: {
      type: 'FETCH',
      url: 'http://localhost:3001/process-high-balance',
      method: 'POST',
      body: { type: 'high_balance' },
      nextStepId: ''
    }
  },
  {
    id: 'step5',
    name: 'Process Low Balance',
    type: 'action',

    finishStep: true,
    action: {
      type: 'FETCH',
      url: 'http://localhost:3001/process-low-balance',
      method: 'POST',
      body: { type: 'low_balance' },
    }
  }
];

export const workflowDefinition: WorkflowDefinition = {
  steps: mockSteps
};