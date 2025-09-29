const express = require('express');
const fileUpload = require('express-fileupload'); // Middleware to handle file uploads
const {
  uploadDocument,
  getAllRequests,
  getRequestById,
  addRequest,
  updateRequestStatus
} = require('../controllers/documentController');
const { isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(fileUpload());


router.post('/upload', uploadDocument);

router.post('/requests', addRequest);

router.get('/requests', isAdmin, getAllRequests);

router.get('/requests/:id', isAdmin, getRequestById);

router.patch('/requests/:id', isAdmin, updateRequestStatus);

module.exports = router;
