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
  "definition": {
    "steps": [
      {
        "id": "step1",
        "type": "api",
        "url": "https://api.example.com/endpoint"
      }
    ],
    "conditions": {
      "if": {
        "condition": "step1.status === 200",
        "then": ["step2"],
        "else": ["step3"]
      }
    }
  },
  "inputs": {
    "key": "value"
  }
}
```

