/**
 * Voice Routes
 *
 * STT and TTS are now fully on-device via RunAnywhere SDK.
 * This router only handles:
 *   POST /api/voice/command  — Process transcript, return intent + action
 *   GET  /api/voice/history  — Voice command history
 */

const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/command', voiceController.processCommand);
router.get('/history', voiceController.getHistory);

module.exports = router;
