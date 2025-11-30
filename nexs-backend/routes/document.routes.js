const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const DocumentController = require('../controllers/document.controller');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, Office documents, and archives are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// All routes require authentication
router.use(auth);

// Get statistics
router.get('/stats', DocumentController.getStats);

// Get documents by project
router.get('/project/:projectId', DocumentController.getByProject);

// CRUD routes
router.get('/', DocumentController.getAll);
router.get('/:id', DocumentController.getById);
router.post('/', upload.single('file'), DocumentController.upload);
router.put('/:id', DocumentController.update);
router.delete('/:id', DocumentController.delete);

module.exports = router;
