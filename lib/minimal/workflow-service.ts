interface WorkflowDefinition {
  steps: Array<{
    id: string;
    type: 'http' | 'branch';
    config: {
      url?: string;
      method?: string;
      body?: unknown;
      condition?: string;
      trueNextStepId?: string;
      falseNextStepId?: string;
    };
    nextStepId?: string;
  }>;
  startStepId: string;
}

interface WorkflowInputs {
  [key: string]: unknown;
}

type Step = WorkflowDefinition['steps'][0];
type StepMap = Record<string, Step>;
type OutputMap = Record<string, unknown>;

interface StepResult {
  conditionResult?: boolean;
  httpResponse?: Record<string, unknown>;
}

export async function executeWorkflow(definition: WorkflowDefinition, inputs: WorkflowInputs) {
  const steps = definition.steps;
  const startStepId = definition.startStepId;

  if (!startStepId || !steps || steps.length === 0) {
    throw new Error('Invalid workflow definition');
  }

  const stepMap: StepMap = {};
  for (const step of steps) {
    stepMap[step.id] = step;
  }

  let currentStepId: string | null = startStepId;
  const outputs: OutputMap = {};


  while (currentStepId) {
    const step = stepMap[currentStepId] as Step;
    const stepDebugOutput: { conditionResult?: boolean, httpResponse?: Record<string, unknown> } = {};
    if (!step) throw new Error(`Step ${currentStepId} not found`);

    if (step.type === 'http') {
      const urlTemplate = step.config.url;
      if (!urlTemplate) throw new Error('URL is required for HTTP step');

      const url = urlTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
        const value = inputs[key];
        if (value === undefined) throw new Error(`Missing input value for ${key}`);
        return String(value);
      });

      const method = step.config.method || 'GET';
      const bodyTemplate = step.config.body;
      const body = bodyTemplate ? JSON.stringify(
        typeof bodyTemplate === 'string'
          ? bodyTemplate.replace(/\{([^}]+)\}/g, (_, key) => String(inputs[key] ?? ''))
          : bodyTemplate
      ) : null;

      const response = await fetch(url, { method, body, headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.statusText}`);
      }

      outputs[step.id] = await response.json();

      currentStepId = step.nextStepId || null;
    }
    if (step.type === 'branch') {
      const conditionStr = step.config.condition;
      if (!conditionStr) {
        throw new Error('Condition is required for branch step');
      }

      const trueNextStepId = step.config.trueNextStepId;
      const falseNextStepId = step.config.falseNextStepId;
      if (!trueNextStepId || !falseNextStepId) {
        throw new Error('Both true and false next step IDs are required for branch step');
      }

      const conditionResult = new Function('outputs', 'inputs', `return ${conditionStr}`)(outputs, inputs);
      currentStepId = conditionResult ? trueNextStepId : falseNextStepId;
      outputs[step.id] = conditionResult;
      stepDebugOutput.conditionResult = conditionResult;
    }


    if (!currentStepId) {
      break;
    }
  }


  return currentStepId ? outputs[currentStepId] : outputs;
}


