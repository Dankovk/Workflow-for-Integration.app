import { startWorkflowService } from './core';
import { testWorkflow } from './test';



const express = require('express');

const app = express();

app.use(express.json());

const runTest = async () => {

  process.stdout.write('\u001b[3J\u001b[2J\u001b[1J');
  console.log('🔄 Running development test...');

  setTimeout(async () => {
    console.clear();
    await testWorkflow();
    setTimeout(() => {
      runTest();
    }, 2000);
  });

};

startWorkflowService().then(() => {
  runTest();
});








