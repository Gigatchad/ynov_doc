const express = require('express');
const { uploadDocument } = require('../controllers/documentController');
const fileUpload = require('express-fileupload'); // Middleware pour gérer les uploads de fichiers

const router = express.Router();

// Middleware pour gérer les fichiers
router.use(fileUpload());

// Route d'upload des documents
router.post('/upload', uploadDocument);

module.exports = router;
