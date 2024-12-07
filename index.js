import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';

import apiVbDen from './routes/vb_den.js';
import apiAuth from './routes/auth.js';
import users from './routes/users.js';
import apiVbDi from './routes/vb_di.js';
import apiLog from './routes/log.js';
import confirm from './routes/confirm.js';

import { fileURLToPath } from 'url';
import { checkDeadlines as checkInboundDeadlines } from './controllers/vb_den.js'; // Nhập hàm kiểm tra văn bản đến


const app = express();


// Lấy đường dẫn thư mục hiện tại
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Cấu hình middleware để phục vụ các file tĩnh
app.use(express.static(path.join(__dirname, 'public'))); // Phục vụ các file tĩnh từ thư mục 'public'
app.use('/doc/', express.static(path.join(__dirname, 'doc'))); // Phục vụ các tài liệu từ thư mục 'doc'


// Cấu hình middleware để xử lý body dữ liệu và session
app.use(bodyParser.urlencoded({ extended: true })); // Xử lý dữ liệu URL-encoded (dành cho form)
app.use(express.json());                           // Xử lý body dữ liệu dạng JSON


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Chỉ sử dụng secure: true khi chạy trên HTTPS
}));

// Định nghĩa route mặc định để phục vụ file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sử dụng các API
//app.use('/api/users', apiUsers());    // API cho người dùng
app.use('/api/users', users)
app.use('/api/vb_den', apiVbDen);   // API cho văn bản đến
app.use('/api/auth', apiAuth);
app.use('/api/vb_di',apiVbDi);
app.use('/api/log',apiLog);
app.use('/',confirm);


function scheduleDailyCheck() {
    // Hàm để tính toán thời gian đến 6 giờ sáng
    const now = new Date();
    const firstRun = new Date();

    // Đặt thời gian cho lần chạy đầu tiên vào 6 giờ sáng
    firstRun.setHours(6, 0, 0, 0);

    // Nếu thời gian hiện tại đã qua 6 giờ sáng, lên lịch cho ngày mai
    if (now > firstRun) {
        firstRun.setDate(firstRun.getDate() + 1);
    }

    // Tính toán thời gian còn lại đến 6 giờ sáng
    const timeUntilFirstRun = firstRun - now;

    // Thiết lập timeout để gọi hàm kiểm tra hạn và sau đó lặp lại mỗi 24 giờ
    setTimeout(() => {
        checkInboundDeadlines;
        setInterval(checkDeadlines, 24 * 60 * 60 * 1000); // Lặp lại hàng ngày
    }, timeUntilFirstRun);

    // Kiểm tra ngay lập tức
    // checkInboundDeadlines();
    // checkOutboundDeadlines();

    // // Thiết lập interval để kiểm tra mỗi 60 giây (1 phút)
    // setInterval(async () => {
    //     await checkInboundDeadlines();
    //     await checkOutboundDeadlines();
    // }, 60 * 1000); // 60 giây
}

// Gọi hàm lên lịch
scheduleDailyCheck();


// Cài đặt cổng mà server sẽ lắng nghe
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server đang chạy trên cổng ${port}`);
});


