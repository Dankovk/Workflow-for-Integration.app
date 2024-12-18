import type { NextFunction, Request, Response } from 'express';
import type { WorkflowDefinition } from './core';
import { workflowDefinition } from './mock';

const express = require('express');

// Mock API Server
const mockApiServer = express();
const mockApiPort = 3001;

mockApiServer.use(express.json());

// Add logging middleware
mockApiServer.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📡 Mock API: ${req.method} ${req.path}`);
  next();
});

// Mock user endpoint
mockApiServer.get('/bitcoin-rate', (req: Request, res: Response) => {
  try {
    console.log('👤 Mock API: Fetching bitcoin rate');
    res.json({
      btcToUsdRate: 45000,
      usdToBtcRate: 0.000022,
    });
  } catch (error) {
    console.error('Error in /bitcoin-rate endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock current balance endpoint
mockApiServer.post('/current-balance', (req: Request, res: Response) => {
  try {

    console.log('💰 Mock API: Checking current balance');
    res.json({
      amount: 10000,
      currency: 'USD',
      btcEquivalent: 10000,
    });
  } catch (error) {
    console.error('Error in /current-balance endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock high balance process endpoint
mockApiServer.post('/process-high-balance', (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('📈 Mock API: Processing high balance transaction', data);
    res.json({
      status: 'processed',
      type: 'high_balance',
      recommendedAction: 'invest',
      suggestedBtcAmount: data?.btcEquivalent * 0.5
    });
  } catch (error) {
    console.error('Error in /process-high-balance endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock low balance process endpoint
mockApiServer.post('/process-low-balance', (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('📉 Mock API: Processing low balance transaction', data);
    res.json({
      status: 'processed',
      type: 'low_balance',
      recommendedAction: 'save',
      minimumSuggestedSaving: data?.amount * 0.2,
      previousData: data
    });
  } catch (error) {
    console.error('Error in /process-low-balance endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start mock API server
mockApiServer.listen(mockApiPort, () => {
  console.log(`🚀 Mock API Server running on port ${mockApiPort}`);
});





export async function testWorkflow(mockData: WorkflowDefinition = workflowDefinition) {
  console.log('🔄 Starting workflow test...');
  console.log('📤 Sending workflow:', JSON.stringify(mockData, null, 2));

  try {
    const response = await fetch('http://localhost:3000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Workflow completed with result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('❌ Error running workflow:', error);
  }
}


