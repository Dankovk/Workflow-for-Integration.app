'use server'


type HttpRequestAction = {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body: string;
  next_step_id?: string;
}

type FunctionCallAction = {
  code: string;
  success_next_step_id?: string;
  failure_next_step_id?: string;
  returns: 'boolean' | 'string';
}



type Action = {
  action_type: 'http_request' | 'function_call';
} & (HttpRequestAction | FunctionCallAction);

type Step = {
  id: string;
  action: Action;
  is_last_step?: boolean;
  is_first_step?: boolean;
};

type Workflow = {
  steps: Step[]
}


type ActionInput = string | Response | boolean | null;


type ActionResult = {
  output: ActionInput;
  next_step_id: string | undefined;
  next: PipeFn;
};


type PipeFn = (input?: ActionInput) => Promise<ActionResult>;

const createEmptyNext = (): PipeFn => {
  return async () => ({
    output: null,
    next_step_id: undefined,
    next: createEmptyNext()
  });
};


const useHttpRequest = (action: HttpRequestAction, getNextStep: (id: string) => Step | undefined) => {
  return async (input?: ActionInput): Promise<ActionResult> => {
    const response = await fetch(action.url, {
      method: action.method,
      headers: action.headers,
      ...(action.method === 'POST' ? { body: action.body } : {})
    });

    const json = await response.json();
    const nextStep = action.next_step_id ? getNextStep(action.next_step_id) : undefined;
    const nextFn: PipeFn = nextStep
      ? (await doStep(nextStep, getNextStep))
      : async () => ({
        output: null,
        next_step_id: undefined,
        next: async () => { throw new Error('No next step'); }
      });

    return {
      output: json,
      next_step_id: action.next_step_id,
      next: nextFn
    };
  };
};
const createFunctionCall = (action: FunctionCallAction) => {
  const actionFunction = new Function('input', action.code);
  return actionFunction;
};
const useFunctionCall = (action: FunctionCallAction, getNextStep: (id: string) => Step | undefined) => {
  const actionFunction = createFunctionCall(action);
  return async (input?: ActionInput): Promise<ActionResult> => {
    const result = await actionFunction(input ?? null);

    const nextStepId = result ? action.success_next_step_id : action.failure_next_step_id;
    const nextStep = nextStepId ? getNextStep(nextStepId) : undefined;
    const nextFn: PipeFn = nextStep
      ? (await doStep(nextStep, getNextStep))
      : async () => ({
        output: null,
        next_step_id: undefined,
        next: async () => { throw new Error('No next step'); }
      });

    return {
      output: result,
      next_step_id: nextStepId,
      next: nextFn
    };
  };
};

const useActionExecutor = (action: Action, getNextStep: (id: string) => Step | undefined) => {
  if (action.action_type === 'http_request' && 'url' in action) {
    return useHttpRequest(action, getNextStep);
  }
  if (action.action_type === 'function_call' && 'code' in action) {
    return useFunctionCall(action, getNextStep);
  }
  throw new Error('Invalid action type');
};

const resultSet = new Set<Record<string, any>>();
const doStep = async (step: Step, getNextStep: (id: string) => Step | undefined): Promise<PipeFn> => {

  const executor = useActionExecutor(step.action, getNextStep);

  return async (input?: ActionInput) => {
    const result = await executor(input);
    resultSet.add({
      input,
      step,
      output: result.output,
      next_step_id: result.next_step_id,
      next: result.next
    });
    return result;
  };
};




const getHead = (workflow: Workflow) => {
  return workflow.steps.find(s => s.is_first_step) || workflow.steps[0];
}

type WorkflowResult = {
  steps: ActionResult[];
  final: ActionResult;
}






export const createWorkflow = async (workflowDefinition: Workflow) => {
  const getNextStep = (id: string) => {
    const step = workflowDefinition.steps.find(s => s.id === id);
    return step;
  };

  const firstStep = getHead(workflowDefinition);


  return async (input?: ActionInput): Promise<WorkflowResult> => {
    let currentFn = await doStep(firstStep, (id) => {
      const nextStep = getNextStep(id);
      if (!nextStep) {
        throw new Error(`Step ${id} not found`);
      }
      return nextStep;
    });

    let result = await currentFn(input);

    while (result.next_step_id) {
      console.log(result.next_step_id);
      const nextStep = getNextStep(result.next_step_id);
      if (!nextStep) {
        throw new Error(`Step ${result.next_step_id} not found`);
      }
      currentFn = await doStep(nextStep, (id) => {
        const nextStep = getNextStep(id);
        return nextStep;
      });
      result = await currentFn(result.output);

    }


    return {
      steps: Array.from(resultSet)

    };
  };
};

export type {
  Action, ActionInput, ActionResult,
  FunctionCallAction, HttpRequestAction,
  Step, Workflow, WorkflowResult
};

