const express = require('express');
const fileUpload = require('express-fileupload'); // Middleware to handle file uploads
const {
  uploadDocument,
  getAllRequests,
  getRequestById,
  getUserRequests, // for student/parent
  addRequest,
  updateRequestStatus
} = require('../controllers/documentController');

const { isAdminOrPersonnel, isAuthenticated , isPersonnel } = require('../middlewares/authMiddleware'); // middleware

const router = express.Router();

router.use(fileUpload());

// Upload document (Personnel only)
router.post('/upload',isPersonnel, uploadDocument);

// Add a new request (Student, Parent, or Personnel)
router.post('/requests', addRequest);

// View all requests (Admin OR Personnel)
router.get('/requests', isAdminOrPersonnel, getAllRequests);

// View request by ID (Admin OR Personnel)
router.get('/requests/:id', isAdminOrPersonnel, getRequestById);

// Update request status (Personnel only)
router.patch('/requests/:id', isPersonnel, updateRequestStatus);

// View own requests (Student or Parent)
router.get('/my-requests', isAuthenticated, getUserRequests);

module.exports = router;
