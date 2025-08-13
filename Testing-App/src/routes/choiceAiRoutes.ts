import { Router } from 'express';
import { ChoiceAiController } from '../controllers/choiceAiController';
import { ChoiceAiLogModel } from '../models/ChoiceAiLogModel';

const router = Router();
const choiceAiController = new ChoiceAiController();

// Execute Choice-AI login test
router.post('/login', async (req, res) => {
  await choiceAiController.executeChoiceAiLoginTest(req, res);
});

// Execute Choice-AI complete E2E test (main endpoint)
router.post('/', async (req, res) => {
  await choiceAiController.executeChoiceAiE2ETest(req, res);
});

// Execute Choice-AI complete E2E test (alternative endpoint)
router.post('/e2e', async (req, res) => {
  await choiceAiController.executeChoiceAiE2ETest(req, res);
});

// Get Choice-AI E2E test status by execution ID
router.get('/e2e/status/:executionId', async (req, res) => {
  await choiceAiController.getE2ETestStatus(req, res);
});

// Get Choice-AI E2E test history
router.get('/e2e/history', async (req, res) => {
  await choiceAiController.getChoiceAiE2ETestHistory(req, res);
});

// Get Choice-AI logs by executionId
router.get('/e2e/logs/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    if (!executionId) return res.status(400).json({ success: false, message: 'Missing executionId' });
    const doc = await ChoiceAiLogModel.findOne({ executionId }).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Logs not found' });
    return res.status(200).json({ success: true, data: { executionId, logs: doc.logs } });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch logs', error: e?.message });
  }
});

export default router; 