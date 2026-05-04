/**
 * Chat Routes
 * POST /api/chat/message       — Save user message, return history for on-device LLM
 * POST /api/chat/save          — Save AI response generated on-device
 * GET  /api/chat/sessions      — List all sessions
 * GET  /api/chat/sessions/:id  — Get session with messages
 * POST /api/chat/sessions      — Create new session
 * DELETE /api/chat/sessions/:id
 // chart 
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/message', chatController.sendMessage);
router.post('/save', chatController.saveResponse);
router.get('/sessions', chatController.getSessions);
router.post('/sessions', chatController.createSession);
router.get('/sessions/:id', chatController.getSession);
router.delete('/sessions/:id', chatController.deleteSession);

module.exports = router;
