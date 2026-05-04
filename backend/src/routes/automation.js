/**
 * Automation Routes
 * GET    /api/automation          — List automations
 * POST   /api/automation          — Create automation
 * PUT    /api/automation/:id      — Update automation
 * DELETE /api/automation/:id      — Delete automation
 * POST   /api/automation/:id/run  — Manually trigger
 * POST   /api/automation/:id/toggle — Enable/disable
 // automation
 */

const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', automationController.list);
router.post('/', automationController.create);
router.put('/:id', automationController.update);
router.delete('/:id', automationController.remove);
router.post('/:id/run', automationController.run);
router.post('/:id/toggle', automationController.toggle);

module.exports = router;
