import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Lấy thư mục hiện tại của tệp mã
const __dirname = path.dirname(new URL(import.meta.url).pathname);

let logData = [];

// Xác định đường dẫn tới file log.json
let logFilePath = path.join(__dirname, '../data/log.json');
if (logFilePath.startsWith('\\')) {
    logFilePath = logFilePath.substring(1);
}

// console.log('Đường dẫn tới file log.json:', logFilePath);

// Hàm để thêm dữ liệu log vào file log.json với id tự động tăng
export function addLogData(newLogEntry) {
    try {
        // Kiểm tra xem file log.json có tồn tại không
        if (existsSync(logFilePath)) {
            // Đọc nội dung hiện tại của file log.json
            const fileContent = readFileSync(logFilePath, 'utf8');
            if (fileContent) {
                logData = JSON.parse(fileContent); // Chuyển từ chuỗi JSON sang mảng/đối tượng
            }
        }

        // Thêm dữ liệu mới vào logData
        logData.push(newLogEntry);

        // Ghi dữ liệu đã cập nhật trở lại vào file log.json
        writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
    } catch (error) {
        console.error('Lỗi khi thêm dữ liệu vào log.json:', error);
    }
}

// Hàm để lấy dữ liệu log theo loại
export function readLogData(req, res) {
    const type = req.params.type;
    try {
        // Kiểm tra xem file log.json có tồn tại không
        if (!existsSync(logFilePath)) {
            console.warn('File log.json không tồn tại.');
            return res.status(404).json({ message: 'File log không tồn tại.' }); // Trả về lỗi 404 nếu file không tồn tại
        }

        // Đọc nội dung của file log.json
        const fileContent = readFileSync(logFilePath, 'utf8');
        if (fileContent) {
            logData = JSON.parse(fileContent); // Cập nhật logData từ file

            // Lọc dữ liệu theo loại
            const filteredLogs = logData.filter(log => log.type === type);

            return res.json(filteredLogs); // Trả về dữ liệu đã lọc
        }
    } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ log.json:', error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi đọc dữ liệu.' }); // Trả về lỗi 500 nếu có lỗi xảy ra
    }

    return res.json([]); // Trả về mảng rỗng nếu không có dữ liệu
}

// Xóa các bản ghi theo loại
export const deleteLogByType = (req, res) => {
    const type = req.params.type;
    console.log(type);
    if (!type) {
        return res.status(400).send('Loại bản ghi cần xóa không được cung cấp.');
    }

    try {
        // Đọc lại dữ liệu log từ file
        const fileContent = readFileSync(logFilePath, 'utf8');
        logData = JSON.parse(fileContent); // Cập nhật logData từ file

        // Lọc các bản ghi không thuộc loại cần xóa
        const updatedLogData = logData.filter(entry => entry.type !== type);

        // Nếu không có bản ghi nào bị xóa, thông báo
        if (updatedLogData.length === logData.length) {
            return res.status(404).send(`Không tìm thấy bản ghi nào với loại "${type}".`);
        }

        // Ghi dữ liệu đã cập nhật trở lại vào file log.json
        writeFileSync(logFilePath, JSON.stringify(updatedLogData, null, 2), 'utf8');
        logData = updatedLogData; // Cập nhật lại logData trong bộ nhớ
        return res.status(200).send(`Đã xóa tất cả bản ghi loại "${type}".`);
    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu trong log.json:', error);
        return res.status(500).send('Đã xảy ra lỗi khi xóa dữ liệu.');
    }
};
export const updateLogByDocumentIdAndType = (documentId, type, nguoiduocgiao, ngaygiao) => {
    if (!documentId || !type || nguoiduocgiao === undefined || !ngaygiao) {
        throw new Error('Thiếu documentId, type, nguoiduocgiao hoặc ngaygiao.');
    }

    try {
        // Đọc lại dữ liệu log từ file
        const fileContent = readFileSync(logFilePath, 'utf8');
        logData = JSON.parse(fileContent); // Cập nhật logData từ file

        // Tìm bản ghi cần chỉnh sửa theo documentId và type
        const logIndex = logData.findIndex(
            (entry) => entry.documentId === Number(documentId) && entry.type === type
        );

        if (logIndex === -1) {
            throw new Error(`Không tìm thấy bản ghi với documentId "${documentId}" và type "${type}".`);
        }

        // Lấy bản ghi cần chỉnh sửa
        const logEntry = logData[logIndex];

        // Thêm nguoiduocgiao và ngaygiao vào mảng tương ứng nếu chưa tồn tại
        if (!Array.isArray(logEntry.nguoiduocgiao)) logEntry.nguoiduocgiao = [];
        if (!Array.isArray(logEntry.ngaygiao)) logEntry.ngaygiao = [];

        
        logEntry.nguoiduocgiao.push(parseInt(nguoiduocgiao));
        logEntry.ngaygiao.push(ngaygiao);
        

        // Ghi dữ liệu đã chỉnh sửa trở lại vào file log.json
        writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf8');
        return logEntry; // Trả về bản ghi đã chỉnh sửa
    } catch (error) {
        console.error('Lỗi khi chỉnh sửa dữ liệu trong log.json:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi hàm
    }
};

// Hàm xóa bản ghi theo documentId và type
export const deleteLogByDocumentIdAndType = (documentId, type) => {
    if (!documentId || !type) {
        throw new Error('Thiếu documentId hoặc type.');
    }

    try {
        // Đọc lại dữ liệu log từ file
        const fileContent = readFileSync(logFilePath, 'utf8');
        logData = JSON.parse(fileContent); // Cập nhật logData từ file

        // Lọc ra các bản ghi không có documentId và type cần xóa
        const updatedLogData = logData.filter(
            (entry) => !(entry.documentId === Number(documentId) && entry.type === type)
        );

        // Kiểm tra nếu không có bản ghi nào bị xóa
        if (updatedLogData.length === logData.length) {
            throw new Error(`Không tìm thấy bản ghi với documentId "${documentId}" và type "${type}".`);
        }

        // Ghi dữ liệu đã cập nhật trở lại vào file log.json
        writeFileSync(logFilePath, JSON.stringify(updatedLogData, null, 2), 'utf8');
        logData = updatedLogData; // Cập nhật lại logData trong bộ nhớ

        console.log(`Đã xóa bản ghi với documentId "${documentId}" và type "${type}".`);
        return { message: `Đã xóa bản ghi với documentId "${documentId}" và type "${type}".` };
    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu trong log.json:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi hàm
    }
};
