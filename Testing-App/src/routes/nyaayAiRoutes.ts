import { Router } from 'express';
import { NyaayAiController } from '../controllers/nyaayAiController';

const router = Router();
const nyaayAiController = new NyaayAiController();

// Execute Nyaay AI complete E2E test (main endpoint)
router.post('/', async (req, res) => {
  await nyaayAiController.executeNyaayAiE2ETest(req, res);
});

// Execute Nyaay AI complete E2E test (alternative endpoint)
router.post('/e2e', async (req, res) => {
  await nyaayAiController.executeNyaayAiE2ETest(req, res);
});

// Get Nyaay AI E2E test status by execution ID
router.get('/e2e/status/:executionId', async (req, res) => {
  await nyaayAiController.getE2ETestStatus(req, res);
});

// Get Nyaay AI E2E test history
router.get('/e2e/history', async (req, res) => {
  await nyaayAiController.getNyaayAiE2ETestHistory(req, res);
});

// Get Nyaay AI logs by executionId
router.get('/e2e/logs/:executionId', async (req, res) => {
  await nyaayAiController.getNyaayAiLogs(req, res);
});

export default router;
