const multer = require('multer');
const path = require('path');

// Configure disk storage destinations based on fieldnames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destFolder = 'uploads/temp';
        
        if (file.fieldname === 'avatar') {
            destFolder = 'uploads/avatars';
        } else if (file.fieldname === 'image') {
            destFolder = 'uploads/images';
        } else if (file.fieldname === 'video') {
            destFolder = 'uploads/videos';
        } else if (file.fieldname === 'audio') {
            destFolder = 'uploads/audio';
        } else if (file.fieldname === 'document') {
            destFolder = 'uploads/documents';
        }
        
        cb(null, path.join(__dirname, '../../', destFolder));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Configure file type rules
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'avatar' || file.fieldname === 'image') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image formats are supported.'), false);
        }
    } else if (file.fieldname === 'video') {
        if (!file.mimetype.startsWith('video/')) {
            return cb(new Error('Only video formats are supported.'), false);
        }
    } else if (file.fieldname === 'audio') {
        if (!file.mimetype.startsWith('audio/')) {
            return cb(new Error('Only audio formats are supported.'), false);
        }
    } else if (file.fieldname === 'document') {
        const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!docTypes.includes(file.mimetype)) {
            return cb(new Error('Unsupported document format.'), false);
        }
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max size
    }
});

module.exports = upload;
