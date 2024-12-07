import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
let filePath = path.join(__dirname, '../data/users.json')

if (filePath.startsWith('\\')) {
    filePath = filePath.substring(1)
}

function readUsers() {
    const rawData = fs.readFileSync(filePath)
    return JSON.parse(rawData)
}

function writeUsers(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Hàm tĩnh để lấy email theo id
export const getEmailById = (idEmail) => {
    console.log(idEmail);
    const users = readUsers();
    const user = users.find(user => user.id === parseInt(idEmail));
    console.log(user.email);
    if (user) {
        return user.email;
    } else {
        throw new Error('User not found');
    }
};

export const getBasicUsers = (req, res) => {
    const users = readUsers();
    const basicUsers = users.map(user => ({
        id: user.id,
        name: user.name,
    }))
    res.json(basicUsers)
}

export const getUsers = (req, res) => {
    const users = readUsers();

    // Loại bỏ trường password khỏi từng người dùng
    const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPassword } = user; // Tách password và trả lại phần còn lại của user
        return userWithoutPassword;
    });

    // Gửi lại danh sách người dùng không có password
    res.json(usersWithoutPassword);
}

export const addUsers = (req, res) => {
    const { name, phone, address, email, role, status } = req.body

    const updatedName = name || null;
    const updatedPhone = phone || null;
    const updatedAddress = address || null;
    const updatedEmail = email || null;
    const updatedRole = role || null;
    const updatedStatus = status !== undefined ? status : null;

    const users = readUsers()

    const emailExists = users.some(user => user.email === updatedEmail)
    const phoneExists = users.some(user => user.phone === updatedPhone)

    if (emailExists) {
        return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    if (phoneExists) {
        return res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
    }

    const newUser = {
        id: users.length + 1,
        name: updatedName,
        phone: updatedPhone,
        address: updatedAddress,
        email: updatedEmail,
        password: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", // Mật khẩu mặc định
        role: updatedRole,
        status: updatedStatus
    };

    users.push(newUser);
    writeUsers(users);

    res.status(201).json(newUser);
}

export const updateUsers = (req, res) => {
    const userId = parseInt(req.params.id);
    const { name, phone, address, email, role, status } = req.body;

    // Gán null cho các trường nếu không có giá trị
    const updatedName = name || null;
    const updatedPhone = phone || null;
    const updatedAddress = address || null;
    const updatedEmail = email || null;
    const updatedRole = role || null;
    const updatedStatus = status !== undefined ? status : null;

    // console.log(userId, updatedName, updatedPhone, updatedAddress, updatedEmail, updatedRole, updatedStatus);

    const users = readUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Cập nhật thông tin người dùng
    users[userIndex] = {
        ...users[userIndex],
        name: updatedName,
        phone: updatedPhone,
        address: updatedAddress,
        email: updatedEmail,
        role: updatedRole,
        status: updatedStatus
    };
    writeUsers(users);

    res.json({
        message: 'Cập nhật người dùng thành công',
        user: users[userIndex]
    });
}

export const deleteUsers = (req, res) => {
    const userId = parseInt(req.params.id);
    const users = readUsers();
    const userIndex = users.findIndex(user => user.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const deletedUser = users.splice(userIndex, 1);
    writeUsers(users);
    res.json(deletedUser);
}

