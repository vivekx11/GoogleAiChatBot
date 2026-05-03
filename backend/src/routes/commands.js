/**
 * Commands Routes
 * POST /api/commands/process — Process any text command (voice or typed)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { processCommand } = require('../controllers/voiceController');

router.use(authenticate);
router.post('/process', processCommand);

module.exports = router;
