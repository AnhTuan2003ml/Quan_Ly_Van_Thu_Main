import fs from 'fs';
import path from 'path';

export const Login = (req,res) =>{
    const { email, password } = req.body;

    // Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
    const __dirname = path.dirname(new URL(import.meta.url).pathname);

    // Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
    let filePath = path.join(__dirname, '../data/users.json');
    // Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
    if (filePath.startsWith('\\')) {
        filePath = filePath.substring(1);
    }

      // Kiểm tra đường dẫn thư mục hiện tại

    // Đọc dữ liệu từ tệp JSON
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Đã xảy ra lỗi khi đọc dữ liệu.');
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.email === email);

        // console.log(user)
        // Kiểm tra thông tin đăng nhập
        if (user && password === user.password) {
            // Giả sử sau khi xác thực thành công
            req.session.userId = user.id;
            req.session.userRole = user.status === 1 ? 'admin' :
                user.status === 2 ? 'vanthu' : 'user';
            return res.json({ success: true, role: req.session.userRole });
        } else {
            return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
        }
    });
}


export const Logout = (req, res) =>{
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Đã xảy ra lỗi khi đăng xuất.');
        }
        res.redirect('/');
    });
}


export const changePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.session.userId;
    console.log(userId,oldPassword,newPassword);

    // Kiểm tra nếu người dùng đã đăng nhập
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để thay đổi mật khẩu.' });
    }

    // Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
    const __dirname = path.dirname(new URL(import.meta.url).pathname);

    // Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
    let filePath = path.join(__dirname, '../data/users.json');
    // Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
    if (filePath.startsWith('\\')) {
        filePath = filePath.substring(1);
    }

    console.log('Đường dẫn tệp:', filePath);
    // Đọc dữ liệu từ tệp JSON
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Đã xảy ra lỗi khi đọc dữ liệu.');
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.id === req.session.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Kiểm tra mật khẩu cũ
        if (oldPassword !== user.password) { // So sánh mật khẩu cũ đã băm
            return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác.' });
        }

        // Cập nhật mật khẩu mới
        user.password = newPassword; // Cập nhật mật khẩu mới (đã băm từ frontend)

        // Ghi lại dữ liệu vào tệp JSON
        fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Đã xảy ra lỗi khi cập nhật mật khẩu.');
            }
            return res.json({ success: true, message: 'Mật khẩu đã được thay đổi thành công.' });
        });
    });
};

export const getProfile = (req, res) => {
    // Kiểm tra nếu người dùng đã đăng nhập
    if (req.session.userId) {
        // Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
        const __dirname = path.dirname(new URL(import.meta.url).pathname);

        // Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
        let filePath = path.join(__dirname, '../data/users.json');
        // Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
        if (filePath.startsWith('\\')) {
            filePath = filePath.substring(1);
        }
        // Đọc dữ liệu từ tệp JSON
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Đã xảy ra lỗi khi đọc dữ liệu.');
            }

            const users = JSON.parse(data);
            // Tìm người dùng theo userId trong session
            const user = users.find(u => u.id === req.session.userId);

            if (user) {
                const { password, ...userWithoutPassword } = user;

                // Trả về thông tin người dùng (không có password)
                return res.json(userWithoutPassword);
            } else {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
            }
        });
    } else {
        // Nếu người dùng chưa đăng nhập
        return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để truy cập thông tin này.' });
    }
}
