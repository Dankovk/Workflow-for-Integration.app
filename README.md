# Workflow Engine

A minimal workflow engine implementation using Bun runtime. This project provides a simple API for executing custom workflows with configurable steps and conditions.

## Features

- Simple HTTP API for workflow execution
- Configurable workflow steps and conditions
- Built with Bun for optimal performance
- Minimal implementation with no external dependencies
- Built-in test workflow with mock data

## Prerequisites

- [Bun](https://bun.sh) runtime installed
- Vercel CLI (optional, for deployment)

## Project Structure

```
.
├── lib/minimal/
│   ├── index.ts         # Main server implementation
│   ├── workflow-service.ts  # Workflow execution logic
│   └── mock.ts          # Mock workflow data for testing
├── lib/overengineered/
│   ├── index.ts         # Main server implementation
│   ├── core.ts  # Workflow execution logic
│   ├── dev.ts          # Development server
│   ├── test.ts          # Test workflow
│   ├── mock.ts          # Mock data
│   └──  config.ts          # Configuration
```

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Run the minimal development server:
```bash
bun run dev
```

3. Run the overengineered development server:
```bash
bun run dev:bloated
```

The server will start on port 3001 and automatically run a test workflow.

## API Usage

### Execute Workflow

```bash
POST /execute-workflow
```

Request body:
```json
{
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

```

