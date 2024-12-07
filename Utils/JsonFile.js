import { existsSync, writeFileSync, readFileSync } from 'fs';
import { sendEmailNotification } from "../controllers/sendEmail.js";
import { getEmailById } from '../controllers/users.js';
import { parse } from 'json2csv'  ;

export function readJSONFile(filePath) {
    if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, 'utf8');

        // Kiểm tra xem nội dung file có rỗng không
        if (!fileContent) {
            console.error('Tệp JSON trống');
            return [];
        }

        try {
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Lỗi phân tích cú pháp JSON:', error);
            return []; // Trả về mảng rỗng nếu có lỗi
        }
    }

    return [];
}


// Hàm ghi dữ liệu vào tệp JSON
export function writeJSONFile(filePath, data) {
    try {
        // Nếu file không tồn tại, tạo file mới
        if (!existsSync(filePath)) {
            writeFileSync(filePath, '[]', 'utf8'); // Tạo file JSON rỗng
        }

        // Ghi lại dữ liệu vào file JSON
        writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Lỗi khi ghi file JSON:', error);
        throw error;
    }
}

// Hàm kiểm tra giá trị rỗng và thay thế bằng null
function checkEmpty(value) {
    return value === '' || value === null || value === undefined ? null : value;
}

// Thêm thông tin văn bản vào JSON
export function addDocument_den(
    sovanban,
    ngayphathanh,
    soDen,
    ngayden,
    noidung,
    chidao,
    ngayxuly,
    hantheovanban,
    hantheochidao,
    nguonphathanh,
    nguoiphutrach_id,
    kinhchuyen,
    link,
    filePath
) {
    return new Promise((resolve, reject) => {
        try {
            const data = readJSONFile(filePath); // Đọc dữ liệu hiện tại từ file JSON

            // Tạo ID mới cho văn bản (ID là số thứ tự tăng dần)
            const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;
            // Parse nguonphathanh nếu nó là chuỗi JSON
            let parsedNguonPhatHanh = nguonphathanh;
            if (typeof nguonphathanh === "string") {
                try {
                    parsedNguonPhatHanh = JSON.parse(nguonphathanh);
                } catch (error) {
                    console.error("Lỗi khi parse nguonphathanh:", error.message);
                    parsedNguonPhatHanh = []; // Đặt giá trị mặc định nếu parse thất bại
                }
            }
            // Tạo đối tượng văn bản mới
            const newDocument = {
                id: newId,  // ID mới
                sovanban: checkEmpty(sovanban),
                ngayphathanh: checkEmpty(ngayphathanh),
                soDen: checkEmpty(soDen),
                ngayden: checkEmpty(ngayden),
                noidung: checkEmpty(noidung),
                chidao: checkEmpty(chidao),
                ngayxuly: checkEmpty(ngayxuly),
                hantheovanban: checkEmpty(hantheovanban),
                hantheochidao: checkEmpty(hantheochidao),
                nguonphathanh: Array.isArray(parsedNguonPhatHanh) ? parsedNguonPhatHanh : [],
                nguoiphutrach: checkEmpty(nguoiphutrach_id),
                nguoikinhgui: checkEmpty(kinhchuyen),
                link: checkEmpty(link),
                status: "uncheck" // Trạng thái mặc định
            };

            // Thêm văn bản mới vào mảng dữ liệu
            data.push(newDocument);

            // Ghi lại dữ liệu vào file JSON
            writeJSONFile(filePath, data);

            // Trả về ID của văn bản mới thêm
            resolve(newDocument.id);
        } catch (error) {
            reject("Lỗi khi thêm văn bản: " + error.message);
        }
    });
}


// Cập nhật thông tin văn bản vào JSON
export function updateDocument_den(
    documentId,  sovanban, ngayphathanh, soDen, ngayden, noidung, chidao, ngayxuly, hantheovanban, hantheochidao, nguonphathanh, nguoiphutrach,kinhchuyen, link, filePath) {

    // // Console.log hiển thị dữ liệu theo thứ tự yêu cầu
    // console.log(JSON.stringify({
    //     id: documentId, // id phải đứng đầu
    //     sovanban: sovanban,
    //     ngayphathanh: ngayphathanh,
    //     soDen: soDen,
    //     ngayden: ngayden,
    //     noidung: noidung,
    //     chidao: chidao,
    //     ngayxuly: ngayxuly,
    //     hantheovanban: hantheovanban,
    //     hantheochidao: hantheochidao,
    //     nguonphathanh: JSON.parse(nguonphathanh), // nguonphathanh sau chidao
    //     nguoiphutrach: nguoiphutrach,
    //     kinhchuyen: kinhchuyen,
    //     link: link, // Đổi từ filePath_doc thành link
    // }, null, 2)); // null và 2 là các tham số để thêm indent (thụt đầu dòng)

    return new Promise((resolve, reject) => {
        try {
            const data = readJSONFile(filePath); // Đọc dữ liệu hiện tại từ file JSON
            const documentIndex = data.findIndex(doc => doc.id === documentId);

            // Kiểm tra xem văn bản có tồn tại không
            if (documentIndex === -1) return reject("Document not found");
            // Parse nguonphathanh nếu nó là chuỗi JSON
            let parsedNguonPhatHanh = nguonphathanh;
            if (typeof nguonphathanh === "string") {
                try {
                    parsedNguonPhatHanh = JSON.parse(nguonphathanh);
                } catch (error) {
                    console.error("Lỗi khi parse nguonphathanh:", error.message);
                    parsedNguonPhatHanh = []; // Đặt giá trị mặc định nếu parse thất bại
                }
            }

            // Cập nhật thông tin văn bản theo thứ tự trong JSON
            data[documentIndex] = {
                id: documentId, // id phải giữ nguyên
                sovanban: checkEmpty(sovanban) || data[documentIndex].sovanban,
                ngayphathanh: checkEmpty(ngayphathanh) || data[documentIndex].ngayphathanh,
                soDen: checkEmpty(soDen) || data[documentIndex].soDen,
                ngayden: checkEmpty(ngayden) || data[documentIndex].ngayden,
                noidung: checkEmpty(noidung) || data[documentIndex].noidung,
                chidao: checkEmpty(chidao) || data[documentIndex].chidao,
                ngayxuly: checkEmpty(ngayxuly) || data[documentIndex].ngayxuly,
                hantheovanban: checkEmpty(hantheovanban) || data[documentIndex].hantheovanban,
                hantheochidao: checkEmpty(hantheochidao) || data[documentIndex].hantheochidao,
                nguonphathanh: parsedNguonPhatHanh || data[documentIndex].nguonphathanh, // Cập nhật nguonphathanh
                nguoiphutrach: checkEmpty(nguoiphutrach) || data[documentIndex].nguoiphutrach,
                nguoikinhgui : checkEmpty(kinhchuyen),
                link: checkEmpty(link) || data[documentIndex].link, // Cập nhật link thay vì filePath_doc
                status: "uncheck", // Giữ nguyên status
            };
            // Ghi lại dữ liệu vào file JSON
            writeJSONFile(filePath, data);

            resolve(); // Hoàn thành cập nhật
        } catch (error) {
            reject("Lỗi khi cập nhật văn bản: " + error.message);
        }
    });
}

export function updateDocument_di(id, sovanbandi, ngayphathanh, donvitiepnhan, noidung, nguoiphutrach, lanhdaophongki, bghd, link, lienket, filePath) {
    return new Promise((resolve, reject) => {
        // Đọc dữ liệu từ file JSON
        const data = readJSONFile(filePath);

        // Tìm chỉ số của tài liệu cần cập nhật
        const documentIndex = data.findIndex(doc => doc.id === id);
        if (documentIndex === -1) {
            return reject(new Error('Document not found')); // Trả về lỗi nếu tài liệu không tồn tại
        }

        // Cập nhật thông tin tài liệu
        data[documentIndex] = {
            ...data[documentIndex], // Giữ lại các thuộc tính cũ
            sovanbandi,
            ngayphathanh,
            donvitiepnhan,
            noidung,
            nguoiphutrach,
            lanhdaophongki,
            bghd,
            link,
            lienket,
            status: "uncheck" // Đặt lại trạng thái
        };

        // Ghi dữ liệu đã cập nhật lại vào file
        writeJSONFile(filePath, data)
            .then(() => resolve()) // Gọi resolve sau khi ghi thành công
            .catch(err => reject(new Error('Error writing to file: ' + err.message))); // Xử lý lỗi khi ghi
    });
}

// Thêm thông tin văn bản vào JSON (loại khác)
export function addDocument_di(sovanban_di, ngayphathanh_di, donvitiepnhan, noidung_di, nguoiphutrach,lanhdaoki, BGHduyet, filePath_doc,lienket, filePath) {
    return new Promise((resolve, reject) => {
        try {
            const data = readJSONFile(filePath);  // Đọc dữ liệu hiện tại từ file JSON

            // Tạo ID mới cho văn bản (ID là số thứ tự tăng dần)
            const newId = data.length > 0 ? data[data.length - 1].id + 1 : 1;  // Tính ID mới dựa trên ID cuối cùng

            // Tạo đối tượng văn bản mới
            const newDocument = {
                id: newId,  // ID mới
                sovanbandi: checkEmpty(sovanban_di),
                ngayphathanh: checkEmpty(ngayphathanh_di),
                donvitiepnhan: checkEmpty(donvitiepnhan),
                noidung: checkEmpty(noidung_di),
                nguoiphutrach: checkEmpty(nguoiphutrach),
                lanhdaophongki:checkEmpty(lanhdaoki),
                bghd: checkEmpty(BGHduyet),
                link: checkEmpty(filePath_doc),
                lienket:checkEmpty(lienket),
                status: "uncheck"
            };

            // Thêm văn bản mới vào mảng dữ liệu
            data.push(newDocument);

            // Ghi lại dữ liệu vào file JSON
            writeJSONFile(filePath, data);

            // Trả về ID của văn bản mới thêm
            resolve(newDocument.id);
        } catch (error) {
            reject('Lỗi khi thêm văn bản: ' + error.message);
        }
    });
}

// Hàm kiểm tra hợp lệ của hạn
export function checkDeadlineValidity(han) {
    const today = new Date();
    const deadline = new Date(han);

    // Kiểm tra xem hạn có hợp lệ và chưa qua
    if (isNaN(deadline)) {
        return 'Ngày hạn không hợp lệ';
    }
    if (deadline < today) {
        return 'Ngày hạn đã qua';
    }
    return 'Ngày hạn hợp lệ';
}

// Hàm tính số ngày còn lại cho các tài liệu
export async function daysUntilDeadline(filePath, type) {
    const data = readJSONFile(filePath);
    const today = new Date();

    for (const doc of data) {
        const deadline = new Date(doc.han);
        const timeDiff = deadline - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Chuyển đổi thành ngày

        // Kiểm tra nếu thời hạn gần kề (<= 3 ngày) và tài liệu chưa hoàn thành
        if (daysDiff >= 0 && daysDiff <= 3) {
            const email = await getEmailById(doc.nguoiphutrach); // Lấy email của người phụ trách
            const subject = `Reminder: Document ${doc.sovanban} Deadline Approaching`;
            const text = `The deadline for document "${doc.sovanban}" is approaching in ${daysDiff} days. Please complete it by ${doc.han}.`;
            const html = `<p>The deadline for document <strong>${doc.tenvb}</strong> is approaching in <strong>${daysDiff}</strong> days.</p><p>Please complete it by <strong>${doc.han}</strong>.</p><p>${type}</p>`;

            try {
                await sendEmailNotification(email, subject, text, html);
                console.log(`Email đã được gửi đến ${email} cho tài liệu ${doc.sovanban}`);
            } catch (error) {
                console.error(`Không thể gửi email cho tài liệu ${doc.tenvb}:`, error);
            }
        }
    }
}

export function readJSONFileID(filePath, id) {
    return new Promise((resolve, reject) => {
        if (existsSync(filePath)) {
            const fileContent = readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);

            // Lọc dữ liệu theo id sử dụng find, trả về phần tử đầu tiên nếu tìm thấy
            const document = data.find(item => item.id === id);

            if (document) {
                resolve(document);
            } else {
                reject('Không tìm thấy văn bản');
            }
        } else {
            reject('Tệp không tồn tại');
        }
    });
}

// Hàm thay đổi trạng thái (status) của văn bản
export function updateDocumentStatus(id, newStatus, filePath) {
    return new Promise((resolve, reject) => {
        // Đọc dữ liệu từ file JSON
        const data = readJSONFile(filePath);

        // Tìm văn bản theo ID
        const documentIndex = data.findIndex(doc => doc.id === id);

        if (documentIndex === -1) {
            return reject('Không tìm thấy văn bản với ID ' + id);
        }

        // Cập nhật trạng thái mới của văn bản
        data[documentIndex].status = newStatus;

        // Ghi lại dữ liệu vào file JSON
        writeJSONFile(filePath, data);

        // Trả về thành công
        resolve({
            success: true,
            message: `Trạng thái của văn bản với ID ${id} đã được cập nhật thành ${newStatus}.`,
            document: data[documentIndex]
        });
    });
}

// Hàm chuyển đổi JSON thành CSV
export function convertJSONToCSV(jsonFilePath) {
    const jsonData = JSON.parse(readFileSync(jsonFilePath, 'utf8')); // Đọc dữ liệu JSON từ file
    if (!jsonData || jsonData.length === 0) {
        throw new Error('File JSON trống hoặc không hợp lệ');
    }

    // Sử dụng json2csv để chuyển đổi JSON thành CSV
    return parse(jsonData);
}