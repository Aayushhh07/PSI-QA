import { Router } from 'express';
import { TestController } from '../controllers/testController';

const router = Router();
const testController = new TestController();

// Execute a new test
router.post('/execute', testController.executeTest.bind(testController));

// Get all test executions
router.get('/executions', testController.getAllExecutions.bind(testController));

// Get a specific test execution
router.get('/executions/:executionId', testController.getExecution.bind(testController));

// Get all executions for a specific website
router.get('/executions/website/:websiteId', testController.getWebsiteExecutions.bind(testController));

// Cancel a test execution
router.patch('/executions/:executionId/cancel', testController.cancelExecution.bind(testController));

export { router as testRoutes }; 