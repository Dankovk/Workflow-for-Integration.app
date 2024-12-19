import type { Request, Response } from 'express';
import { WORKFLOW_SERVICE_PORT } from './config';
const express = require('express');
const app = express();
const port = WORKFLOW_SERVICE_PORT;


app.use(express.json());

export type StepType =  {
  name: string;
  type: 'action' | 'condition';
  startStep?: boolean;
  finishStep?: boolean;
  id: string;
  action?: {
    type: 'FETCH'
    url: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    nextStepId?: string;
  }
  logic?: {
    type: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN';
    operands: {
      left: string;
      right: string;
    },
    conditionMetNextStepId: string;
    conditionFailedNextStepId: string;
  }
};

export type WorkflowDefinition = {
  steps: StepType[];
};


const OperationToOperatorMap = {
  EQUALS: '=',
  GREATER_THAN: '>',
  LESS_THAN: '<'
}

const findFirstLastStep = (steps: StepType[]) => {
  return [steps.find(step => step.startStep), steps.find(step => step.finishStep)] as [StepType, StepType];
}

type StepResult = {
  status: 'success' | 'error';
  condition?: 'met' | 'not_met';
  payload?: Record<string, {key: string, value: string}>;
  error?: Error;
}

type WorkflowResult = {
  stepsTrace: Record<string, StepResult>;
}

export class Step {
  stepSchema: StepType;
  nextStepId: string;
  status: 'completed' | 'in_progress' | 'created' | 'failed';
  payload: Record<string, unknown> = {};
  constructor(stepSchema: StepType) {
    this.stepSchema = stepSchema;
    this.nextStepId = stepSchema.action?.nextStepId || '';
    this.status = 'created';
  }

  async process(): Promise<StepResult> {
    this.status = 'in_progress';
    if (this.stepSchema.type === 'action') {
      const res = await this.processAction();
      this.status = 'completed';
      return res;
    }
    if (this.stepSchema.type === 'condition') {
      const res = await this.processCondition();
      this.status = 'completed';
      return res;
    }
    throw new Error('Invalid step type');
  }

  async makeHttpRequest(): Promise<StepResult> {
    if (!this.stepSchema.action) {
      throw new Error('Action not found');
    }
    const { url, method } = this.stepSchema.action;
    const res = await fetch(url, {
      method
    });
    try {
      const data = await res.json();

      return {
        status: 'success' as const,
        payload: data
      };
    } catch (error) {
      this.status = 'failed';
      return {
        status: 'error' as const,
        error: error as Error
      };
    }
  }

  async processCondition(): Promise<StepResult> {
    if (!this.stepSchema.logic) {
      throw new Error('Logic not found');
    }
    const conditionMet = this.compareEvaluation(this.stepSchema.logic.operands.left, this.stepSchema.logic.operands.right);
    if (conditionMet) {
      this.nextStepId = this.stepSchema.logic.conditionMetNextStepId;
    } else {
      this.nextStepId = this.stepSchema.logic.conditionFailedNextStepId;
    }
    return {
      status: 'success',
      condition: conditionMet ? 'met' : 'not_met',
    };
  }

  async processAction() {
    return await this.makeHttpRequest();
  }

  compareEvaluation(left: string, right: string) {
    if (!this.stepSchema.logic?.type) {
      throw new Error('Condition type not found');
    }
    const operator = OperationToOperatorMap[this.stepSchema.logic?.type ?? 'EQUALS'];
    const functionToEval = new Function('left', 'right', `return left ${operator} right`);
    return functionToEval(left, right);
  }

}

 class Workflow {
  steps!: Map<string, Step>;
  stepsSchema!: StepType[];
  currentStepId!: string;
  firstStepId!: string;
  lastStepId!: string;
  nextStepId!: string;
  stepsTrace: Record<string, StepResult> = {};
  constructor(steps: StepType[]) {
    this.steps = new Map();
    this.stepsSchema = steps;
    const [firstStep, lastStep] = findFirstLastStep(steps);
    this.firstStepId = firstStep?.id ?? '';
    this.lastStepId = lastStep?.id ?? '';
    this.currentStepId = this.firstStepId;


    for (const step of steps) {
      this.steps.set(step.id, new Step(step));
    }
  }

  async processStep(step: Step): Promise<StepResult> {
    const stepResult = await step.process();
    return stepResult;
  }

  async go(): Promise<WorkflowResult> {
    const currentStep = this.steps.get(this.currentStepId);
    const stepsTrace: Record<string, StepResult> = {};
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    const stepResult = await this.processStep(currentStep);
    stepsTrace[currentStep.stepSchema.id] = stepResult;
    if (currentStep.stepSchema.finishStep) {
      return {
        stepsTrace
      }
    }

    this.nextStepId = currentStep.nextStepId;

    if (!this.nextStepId) {
      return {
        stepsTrace
      };
    }

    this.currentStepId = this.nextStepId;
    return this.go();
  }

  async start() {
    this.currentStepId = this.firstStepId;
    return this.go();
  }
}

const createWorkflow = async (workflowDefinition: WorkflowDefinition): Promise<Workflow> => {
  const workflow = new Workflow(workflowDefinition.steps);
  return workflow;
};

app.post('*', async (req: Request, res: Response) => {
  try {
    const workflowDefinition = req.body as WorkflowDefinition;
    const workflow = await createWorkflow(workflowDefinition);
    const result = await workflow.start();
    res.json(result);
  } catch (error) {
    console.error('Workflow execution failed:', error);
    res.status(500).json({
      error: 'Workflow execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const startWorkflowService = async () => {
  console.log('Starting workflow service on port', port);
  return new Promise((resolve, reject) => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(app);
    });
  });
}

export { startWorkflowService };
