export const mockWorkflow = {
  definition: {
    steps: [
      {
        id: "step0",
        type: "http",
        config: {
          url: "https://jsonplaceholder.typicode.com/users/{userId}",
          method: "GET"
        },
        nextStepId: "step1"
      },
      {
        id: "step1",
        type: "http",
        config: {
          url: "https://jsonplaceholder.typicode.com/posts?userId={userId}",
          method: "GET"
        },
        nextStepId: "step2"
      },
      {
        id: "step2",
        type: "branch",
        config: {
          condition: "outputs.step1.length > 5 && inputs.includeComments",
          trueNextStepId: "step3",
          falseNextStepId: "step4"
        }
      },
      {
        id: "step3",
        type: "http",
        config: {
          url: "https://jsonplaceholder.typicode.com/posts/{userId}/comments",
          method: "GET"
        }
      },
      {
        id: "step4",
        type: "http",
        config: {
          url: "https://jsonplaceholder.typicode.com/users/{userId}/todos",
          method: "GET"
        }
      }
    ],
    startStepId: "step0"
  },
  inputs: {
    userId: 1,
    includeComments: true
  }
};
