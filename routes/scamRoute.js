const express = require('express');
const {
  startSession,
  sendMessage,
  getSessionById,
  getMySessions,
  endSession,
  deleteSession,
} = require('../controllers/scamController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/start', protect, startSession);
router.post('/:sessionId/message', protect, sendMessage);
router.get('/history', protect, getMySessions);
router.get('/:sessionId', protect, getSessionById);
router.patch('/:sessionId/end', protect, endSession);
router.delete('/:sessionId', protect, deleteSession);

module.exports = router;
