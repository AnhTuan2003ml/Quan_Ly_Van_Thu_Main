import { Router } from 'express';
import { Get_vb_den, Post_vb_den, Put_vb_den, Delete, __dirname, GetDocumentInfo, getFileCSV, Get_vb_by_id } from '../controllers/vb_den.js';
import multer from 'multer';
import path from 'path';  // Đảm bảo rằng path đã được import
import fs from 'fs';  // Đảm bảo rằng fs đã được import
import { ensureAuthenticated } from '../middleware/Middleware.js';

// Định nghĩa thư mục để lưu file tải lên
let uploadDir = path.join(__dirname, '../doc');
if (uploadDir.startsWith('\\')) {
    uploadDir = uploadDir.substring(1);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);  // Đặt thư mục lưu trữ
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Lấy phần mở rộng của file
        const baseName = path.basename(file.originalname, ext); // Lấy tên file không có phần mở rộng
        let filePath = path.join(uploadDir, file.originalname); // Đặt tên file ban đầu

        // Kiểm tra nếu tệp đã tồn tại trong thư mục
        let counter = 1;
        while (fs.existsSync(filePath)) {
            filePath = path.join(uploadDir, `${baseName}_${counter}${ext}`); // Đổi tên file với hậu tố _1, _2...
            counter++;
        }

        // Gửi tên file mới
        cb(null, path.basename(filePath)); // Trả về tên file đã được đổi tên (nếu có)
    }
});

const upload = multer({ storage: storage });

const router = Router();
router.get('/', ensureAuthenticated, Get_vb_den);
router.get('/:id', ensureAuthenticated, Get_vb_by_id);
router.get('/info', ensureAuthenticated, GetDocumentInfo);
router.put('/:id', ensureAuthenticated, upload.single('documentFile'), Put_vb_den);
router.post('/', ensureAuthenticated, upload.single('documentFile'), Post_vb_den);
router.delete('/:id', ensureAuthenticated, Delete);
router.get('/getfile', ensureAuthenticated,getFileCSV);
export default router;
