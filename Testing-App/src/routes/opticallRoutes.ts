import { Router } from 'express';
import { OpticallController } from '../controllers/opticallController';

const router = Router();
const opticallController = new OpticallController();

// Execute Opticall complete E2E test (main endpoint)
router.post('/', async (req, res) => {
  await opticallController.executeOpticallE2ETest(req, res);
});

// Execute Opticall complete E2E test (alternative endpoint)
router.post('/e2e', async (req, res) => {
  await opticallController.executeOpticallE2ETest(req, res);
});

// Get Opticall E2E test status by execution ID
router.get('/e2e/status/:executionId', async (req, res) => {
  await opticallController.getE2ETestStatus(req, res);
});

// Get Opticall E2E test history
router.get('/e2e/history', async (req, res) => {
  await opticallController.getOpticallE2ETestHistory(req, res);
});

export default router;
