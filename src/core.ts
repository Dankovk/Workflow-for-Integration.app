import type { Request, Response } from 'express';
import { WORKFLOW_SERVICE_PORT } from '../config';
const express = require('express');
const app = express();
const port = WORKFLOW_SERVICE_PORT;

app.use(express.json());

export type StepType = {
  name: string;
  type: 'action' | 'condition';
  startStep?: boolean;
  finishStep?: boolean;
  id: string;
  action?: {
    type: 'FETCH';
    url: string;
    method: 'GET' | 'POST';
    body?: Record<string, unknown>;
    nextStepId?: string;
  };
  logic?: {
    type: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN';
    operands: {
      left: string;
      right: string;
    };
    conditionMetNextStepId: string;
    conditionFailedNextStepId: string;
  };
};

export type WorkflowDefinition = {
  steps: StepType[];
};

const OperationToOperatorMap = {
  EQUALS: '=',
  GREATER_THAN: '>',
  LESS_THAN: '<'
};

type StepResult = {
  status: 'success' | 'error';
  condition?: 'met' | 'not_met';
  input?: StepResult | null;
  output?: Record<string, unknown>;
  error?: Error;
};

type StepPipeData = {
  input: StepResult | null;
  output: StepResult;
  error?: Error;
  status: 'completed' | 'in_progress' | 'failed';
};

const findFirstLastStep = (steps: StepType[]) => {
  return [
    steps.find(step => step.startStep),
    steps.find(step => step.finishStep)
  ] as [StepType, StepType];
};

export class Step {
  stepSchema: StepType;
  nextStepId: string;
  status: 'completed' | 'in_progress' | 'created' | 'failed';

  constructor(stepSchema: StepType) {
    this.stepSchema = stepSchema;
    this.nextStepId = stepSchema.action?.nextStepId || '';
    this.status = 'created';
  }

  async process(input: StepResult | null = null): Promise<StepPipeData> {
    this.status = 'in_progress';

    try {
      if (this.stepSchema.type === 'action') {
        const res = await this.processAction(input);
        this.status = 'completed';
        return {
          input: input || null,
          output: res,
          status: 'completed'
        };
      }

      if (this.stepSchema.type === 'condition') {
        const res = await this.processCondition(input);
        this.status = 'completed';
        return {
          input: input || null,
          output: res,
          status: 'completed'
        };
      }

      throw new Error('Invalid step type');
    } catch (error) {
      this.status = 'failed';
      return {
        input: input || null,
        output: { status: 'error', error: error as Error },
        status: 'failed'
      };
    }
  }

  async makeHttpRequest(input: StepResult | null = null): Promise<StepResult> {
    if (!this.stepSchema.action) {
      throw new Error('Action not found');
    }

    const { url, method } = this.stepSchema.action;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(input && { body: JSON.stringify(input) })
    });

    const data = await res.json();
    return {
      status: 'success',
      output: data,
      input: input || null
    };
  }

  async processCondition(input: StepResult | null = null): Promise<StepResult> {
    if (!this.stepSchema.logic) {
      throw new Error('Logic not found');
    }

    const conditionMet = this.compareEvaluation(
      this.stepSchema.logic.operands.left,
      this.stepSchema.logic.operands.right
    );

    this.nextStepId = conditionMet
      ? this.stepSchema.logic.conditionMetNextStepId
      : this.stepSchema.logic.conditionFailedNextStepId;

    return {
      status: 'success',
      condition: conditionMet ? 'met' : 'not_met',
      input: input || null
    };
  }

  async processAction(input: StepResult | null = null): Promise<StepResult> {
    return this.makeHttpRequest(input);
  }

  compareEvaluation(left: string, right: string): boolean {
    if (!this.stepSchema.logic?.type) {
      throw new Error('Condition type not found');
    }

    const operator = OperationToOperatorMap[this.stepSchema.logic.type];
    const functionToEval = new Function('left', 'right', `return left ${operator} right`);
    return functionToEval(left, right);
  }
}

export class Workflow {
  steps: Map<string, Step>;
  stepsSchema: StepType[];
  currentStepId: string;
  firstStepId: string;
  lastStepId: string;
  nextStepId: string;
  stepsTrace: Record<string, StepPipeData>;

  constructor(steps: StepType[]) {
    const [firstStep, lastStep] = findFirstLastStep(steps);

    this.steps = new Map(steps.map(step => [step.id, new Step(step)]));
    this.stepsSchema = steps;
    this.firstStepId = firstStep.id;
    this.lastStepId = lastStep.id;
    this.currentStepId = this.firstStepId;
    this.nextStepId = this.firstStepId;
    this.stepsTrace = {};
  }

  async processStep(step: Step, input: StepResult | null = null): Promise<StepPipeData> {
    return step.process(input);
  }

  async iterate(input: StepResult | null = null): Promise<Record<string, StepPipeData>> {
    const currentStep = this.steps.get(this.currentStepId);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    const stepOutput = await this.processStep(currentStep, input);
    this.stepsTrace[currentStep.stepSchema.id] = stepOutput;

    if (currentStep.stepSchema.finishStep) {
      return this.stepsTrace;
    }

    this.nextStepId = currentStep.nextStepId;
    this.currentStepId = this.nextStepId;
    return this.iterate(stepOutput.output);
  }

  async start(): Promise<Record<string, StepPipeData>> {
    this.currentStepId = this.firstStepId;
    return this.iterate();
  }
}

export const createWorkflow = async (workflowDefinition: WorkflowDefinition): Promise<Workflow> => {
  return new Workflow(workflowDefinition.steps);
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

export const startWorkflowService = async (): Promise<unknown> => {
  console.log('Starting workflow service on port', port);
  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(app);
    });
  });
};
