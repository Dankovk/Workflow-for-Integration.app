import { startWorkflowService } from './core';
import { testWorkflow } from './test';

startWorkflowService().then(async () => {
  try {
    const result = await testWorkflow();

    console.log('🔄 Final Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running workflow:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
});
