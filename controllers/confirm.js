import jwt from 'jsonwebtoken';  // Sử dụng cú pháp import
import { changeDocumentStatusById_den } from './vb_den.js';
import { changeDocumentStatusById_di } from './vb_di.js';
// Bí mật dùng để ký token (nên được bảo mật và không tiết lộ)
const secretKey = 'your-secret-key';

// Hàm tạo token bằng email và thời gian hết hạn được truyền vào
export  function generateToken(email, expiresInDays,id,type) {
    console.log(email);
    const payload = {
        email: email,  // Lưu email vào payload
        issuedAt: new Date().toISOString(), 
        id: id,
        type:type
    };

    // Chuyển số ngày thành chuỗi theo định dạng "Xd" (với X là số ngày)
    const expiresIn = `${expiresInDays}h`;

    const options = {
        expiresIn: expiresIn, // Thời gian hết hạn được truyền vào
    };

    // Tạo và ký token
    const token = jwt.sign(payload, secretKey, options);
    return token;
}

// // Ví dụ sử dụng hàm tạo token với email và thời gian hết hạn được truyền vào (2 ngày)
// const userEmail = 'user@example.com';  // Email người dùng của bạn
// const token = generateToken(userEmail, 3);  // Token sẽ hết hạn sau 3 ngày
// console.log('Generated Token:', token);

// Hàm tạo link với token
export function generateConfirmLink(email, expiresInDays,id,type) {
    const token = generateToken(email, expiresInDays,id,type);  // Tạo token với email và thời gian hết hạn
    // const confirmLink = `https://yourwebsite.com/confirm?token=${token}`;  // Tạo link chứa token
    const confirmLink = `http://localhost:3000/confirm?token=${token}`;  // Tạo link chứa token
    return confirmLink;
}
export const verifyToken = (req, res) => {
    // Lấy token từ query string
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'Token không được cung cấp.'
        });
    }

    try {
        // Giải mã và xác minh token
        const decoded = jwt.verify(token, secretKey);
        // Kiểm tra thời gian
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        if (decoded.iat > now) {
            return res.status(400).json({
                success: false,
                message: 'Token chưa có hiệu lực.'
            });
        }
        if (decoded.exp < now) {
            return res.status(400).json({
                success: false,
                message: 'Token đã hết hạn.'
            });
        }

        // Kiểm tra loại văn bản
        if (decoded.type === 'văn bản đến') {
            // Gọi hàm changeDocumentStatusById_den nếu là văn bản đến
            changeDocumentStatusById_den(decoded.id)
                .then(() => {
                    return res.status(200).json({
                        message: 'Đã xác nhận'
                    });
                })
                .catch(error => {
                    return res.status(500).json({
                        success: false,
                        message: `Lỗi khi cập nhật trạng thái văn bản đến: ${error.message}`
                    });
                });
        } else if (decoded.type === 'văn bản đi') {
            // Gọi hàm changeDocumentStatusById_di nếu là văn bản đi
            changeDocumentStatusById_di(decoded.id)
                .then(() => {
                    return res.status(200).json({
                        message: 'Đã xác nhận'
                    });
                })
                .catch(error => {
                    return res.status(500).json({
                        success: false,
                        message: `Lỗi khi cập nhật trạng thái văn bản đi: ${error.message}`
                    });
                });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Loại văn bản không hợp lệ.'
            });
        }
    } catch (error) {
        // Lỗi khi xác minh token
        console.error('Lỗi xác nhận token:', error);
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ.'
        });
    }
};