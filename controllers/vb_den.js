
import { existsSync, unlinkSync} from 'fs';
import path from 'path';
import { getEmailById } from './users.js';
import { testSendEmail_multi, testSendEmail_single } from "./sendEmail.js";
import { readJSONFile, readJSONFileID, writeJSONFile, updateDocument_den, addDocument_den, daysUntilDeadline, updateDocumentStatus, convertJSONToCSV } from '../Utils/JsonFile.js';
import {generateConfirmLink} from './confirm.js';

// Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
export const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
export let filePath = path.join(__dirname, '../data/vb_den.json');
// Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
if (filePath.startsWith('\\')) {
    filePath = filePath.substring(1);
}


export const Get_link_vb_den = async (id) => {
    const data = readJSONFile(filePath);

    // Tìm văn bản có ID trùng với id
    const document = data.find(doc => doc.id === id);
    // console.log(id,document)
    // Nếu tìm thấy văn bản, trả về link của nó, nếu không trả về lỗi
    if (document) {
        return { link: document.link };
    } else {
        // Trả về một đối tượng có lỗi khi không tìm thấy tài liệu
        return { link: null, error: 'Document not found' };
    }
};
export const Get_vb_by_id = (req, res) => {
    const documentId = req.params.id; // Lấy ID văn bản từ URL (được truyền qua params)
    const data = readJSONFile(filePath); // Đọc dữ liệu từ file JSON

    // Tìm văn bản theo ID
    const document = data.find(doc => doc.id === parseInt(documentId)); // Chuyển ID sang số

    if (!document) {
        // Nếu không tìm thấy văn bản, trả về lỗi
        return res.status(404).json({
            success: false,
            message: 'Văn bản không tồn tại.'
        });
    }

    // Nếu tìm thấy, trả về thông tin văn bản
    return res.json({
        success: true,
        document: document // Trả về thông tin văn bản
    });
};
export const GetDocumentInfo = (req, res) => {
    const data = readJSONFile(filePath);
    // Lấy thông tin các văn bản và tạo một mảng mới chứa các đối tượng id và info
    const documentInfo = data.map(doc => {
        // Tạo chuỗi thông tin bao gồm  ngayden, so
        const info = `Ngày đến: ${doc.ngayden} - Số: ${doc.so}`;
        // Trả về đối tượng chứa id và chuỗi thông tin
        return {
            id: doc.id,
            info: info
        };
    });
    // console.log(documentInfo);
    // Trả về mảng documentInfo dưới dạng JSON
    res.json(documentInfo);
};




export const Get_vb_den = (req, res) => {
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    const data = readJSONFile(filePath);
    if (userRole === 'user') {
        const userDocuments = data.filter(doc => doc.nguoiphutrach === userId);
        return res.json(userDocuments);
    }
    return res.json(data);
}
export const Put_vb_den = (req, res) => {
    const documentId = parseInt(req.params.id);
    console.log(req.body);
    const { sovanban, ngayphathanh, soDen, ngayden, noidung, chidao, ngayxuly, hantheovanban, hantheochidao, nguonphathanh, nguoiphutrach, kinhchuyen, oldFilePath } = req.body;
    const documentFile = req.file; // Tệp mới nếu có
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    let filePath_doc = documentFile
        ? `../../doc/${path.basename(documentFile.filename)}`  // Sửa lại đường dẫn
        : oldFilePath || null;  // Nếu không có tệp mới, lấy đường dẫn cũ nếu có

    // Kiểm tra xem có tệp không
    if (filePath_doc) {
        const data = readJSONFile(filePath);  // Đọc dữ liệu từ file JSON

        const existingDocument = data.find(doc => doc.link === filePath_doc);  // Kiểm tra nếu tệp đã tồn tại trong cơ sở dữ liệu

        if (existingDocument) {
            // Nếu tệp đã tồn tại, nhưng là tệp khác (không phải tệp hiện tại)
            if (existingDocument.id !== documentId) {
                const ext = path.extname(filePath_doc);  // Lấy phần mở rộng của tệp
                const baseName = path.basename(filePath_doc, ext);  // Lấy tên gốc của tệp (không bao gồm phần mở rộng)

                let counter = 1;
                let newFilePath = `../../doc/${baseName}_${counter}${ext}`;  // Đặt tên mới cho tệp

                // Kiểm tra xem tên mới có bị trùng lặp không
                while (data.some(doc => doc.link === newFilePath)) {
                    counter++;
                    newFilePath = `../../doc/${baseName}_${counter}${ext}`;  // Nếu trùng, thêm hậu tố để đổi tên tệp
                }

                // Cập nhật lại đường dẫn tệp
                filePath_doc = newFilePath;
                console.log(`Tên tệp mới: ${filePath_doc}`);
            }
            // Nếu là tệp hiện tại (id giống nhau), không thay đổi tên
        }
        console.log(`Tên tệp : ${filePath_doc}`);
    }

    // Tìm thông tin văn bản cũ
    readJSONFileID(filePath, parseInt(documentId))
        .then(oldDocument => {
            console.log("Kính chuyển: ", kinhchuyen);

            // So sánh và tạo danh sách các thuộc tính thay đổi
            let minutesRemaining, hoursRemaining;
            if (oldDocument.nguoiphutrach !== parseInt(nguoiphutrach)) {
                const oldEmail = getEmailById(oldDocument.nguoiphutrach);
                const newEmail = getEmailById(nguoiphutrach);

                // Lấy ngày hiện tại
                const currentDate = new Date();

                // Lấy ngày hết hạn từ hantheochidao hoặc hantheovanban
                const expirationDate = new Date(oldDocument.hantheochidao || oldDocument.hantheovanban);

                if (isNaN(expirationDate.getTime())) {
                    console.error("Ngày hết hạn không hợp lệ.");
                } else {
                    const timeDifference = expirationDate - currentDate;

                    // Chuyển đổi sự khác biệt thành giờ và phút
                    hoursRemaining = Math.floor(timeDifference / (1000 * 60 * 60));  // Giờ
                    minutesRemaining = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)); // Phút

                    let token_old;
                    let token_new;

                    if (hoursRemaining > 0 || minutesRemaining > 0) {
                        token_new = generateConfirmLink(newEmail, hoursRemaining, oldDocument.id, "văn bản đến");
                        token_old = generateConfirmLink(oldEmail, hoursRemaining, oldDocument.id, "văn bản đến");
                    } else {
                        console.log("Ngày hết hạn đã qua.");
                        token_new = generateConfirmLink(newEmail, 24, oldDocument.id, "văn bản đến");
                        token_old = generateConfirmLink(oldEmail, 24, oldDocument.id, "văn bản đến");
                    }
                    testSendEmail_multi(oldEmail, newEmail, token_new, token_old);
                }
            }

            // Kiểm tra nếu người kính chuyển đã thay đổi
            if (parseInt(oldDocument.nguoikinhgui) !== parseInt(kinhchuyen)) {
                let kinhchuyen_email;
                let kinhchuye_token;

                try {
                    kinhchuyen_email = getEmailById(parseInt(kinhchuyen)); // Lấy email người kính chuyển

                    if (kinhchuyen_email) {
                        // Tạo token cho người kính chuyển
                        kinhchuye_token = generateConfirmLink(
                            kinhchuyen_email,
                            hoursRemaining > 0 ? hoursRemaining : 24,
                            oldDocument.id,
                            'văn bản đến'
                        );

                        console.log("ID người kính chuyển:", kinhchuyen);
                        console.log("Email người kính chuyển:", kinhchuyen_email);

                        // Gửi email đến người kính chuyển
                        testSendEmail_single(kinhchuyen_email, kinhchuye_token);
                    } else {
                        console.error("Không tìm thấy email của người kính chuyển.");
                    }
                } catch (error) {
                    console.error("Lỗi khi xử lý email cho người kính chuyển:", error);
                }
            }

            // Cập nhật thông tin văn bản
            updateDocument_den(documentId,  sovanban, ngayphathanh, parseInt(soDen), ngayden, noidung, chidao, ngayxuly, hantheovanban, hantheochidao, nguonphathanh, parseInt(nguoiphutrach), parseInt(kinhchuyen), filePath_doc, filePath)
                .then(() => {
                    res.json({ success: true, message: 'Văn bản đã được cập nhật thành công.' });
                })
                .catch(err => {
                    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật văn bản.' });
                });
        })
        .catch(err => {
            res.status(500).json({ success: false, message: 'Không tìm thấy văn bản.' });
        });
}


export const Post_vb_den = (req,res) => {
    const { sovanban, ngayphathanh, soDen, ngayden, noidung, chidao, ngayxuly, hantheovanban, hantheochidao, nguonphathanh, nguoiphutrach, kinhchuyen ,oldFilePath} = req.body;
    const documentFile = req.file; // Tệp mới nếu có
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    let filePath_doc = documentFile
        ? `../../doc/${path.basename(documentFile.filename)}`  // Sửa lại đường dẫn
        : oldFilePath || null;  // Nếu không có tệp mới, lấy đường dẫn cũ nếu có

    // Kiểm tra xem có tệp không
    if (filePath_doc) {
        const data = readJSONFile(filePath);  // Đọc dữ liệu từ file JSON

        const existingDocument = data.find(doc => doc.link === filePath_doc);  // Kiểm tra nếu tệp đã tồn tại trong cơ sở dữ liệu

        if (existingDocument) {
                const ext = path.extname(filePath_doc);  // Lấy phần mở rộng của tệp
                const baseName = path.basename(filePath_doc, ext);  // Lấy tên gốc của tệp (không bao gồm phần mở rộng)

                let counter = 1;
                let newFilePath = `../../doc/${baseName}_${counter}${ext}`;  // Đặt tên mới cho tệp

                // Kiểm tra xem tên mới có bị trùng lặp không
                while (data.some(doc => doc.link === newFilePath)) {
                    counter++;
                    newFilePath = `../../doc/${baseName}_${counter}${ext}`;  // Nếu trùng, thêm hậu tố để đổi tên tệp
                }

                // Cập nhật lại đường dẫn tệp
                filePath_doc = newFilePath;
                console.log(`Tên tệp mới: ${filePath_doc}`);
            }
        console.log(`Tên tệp : ${filePath_doc}`);
    }

    let token_new;
    const newEmail = getEmailById(nguoiphutrach);
    // console.log(newDocument);
    // Lấy ngày hiện tại
    const currentDate = new Date();


    // Lấy ngày hết hạn từ hantheochidao hoặc hantheovanban
    const expirationDate = new Date(
        hantheochidao || hantheovanban
    );
    let hoursRemaining;
    // Kiểm tra nếu ngày hết hạn hợp lệ
    if (isNaN(expirationDate.getTime())) {
        console.error("Ngày hết hạn không hợp lệ.");
    } else {
        // Tính toán sự khác biệt giữa ngày hết hạn và ngày hiện tại (mili giây)
        const timeDifference = expirationDate - currentDate;

        // Chuyển đổi sự khác biệt thành giờ và phút
        hoursRemaining = Math.floor(timeDifference / (1000 * 60 * 60));  // Chuyển từ mili giây sang giờ
        
    }


    
    // Thêm văn bản mới vào cơ sở dữ liệu (hoặc file)
    addDocument_den(sovanban, ngayphathanh, parseInt(soDen), ngayden, noidung, chidao, ngayxuly, hantheovanban, hantheochidao, nguonphathanh, parseInt(nguoiphutrach), parseInt(kinhchuyen), filePath_doc,filePath)
        .then((documentId) => {
            const id_doc = documentId;
            const timestamp = new Date().toISOString(); // Thời gian thay đổi
            // Kiểm tra nếu ngày hết hạn còn lớn hơn ngày hiện tại
            if (hoursRemaining > 0) {
                token_new = generateConfirmLink(newEmail, hoursRemaining, documentId, "văn bản đến");
                
            }
            else{
                token_new = generateConfirmLink(newEmail, 24, documentId, "văn bản đến");
            }
            testSendEmail_single(newEmail, token_new);
            res.json({ success: true, message: 'Văn bản đến đã được thêm thành công.', documentId: id_doc });
        })
        .catch(err => {
            // Lỗi khi thêm văn bản, trả về phản hồi ngay
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm văn bản đến', error: err.message });
            }
        });
}

export const Delete = (req,res) =>{
    const documentId = parseInt(req.params.id); // Chuyển ID từ chuỗi sang số
    console.log("Văn bản cần xóa:", documentId);

    // Đọc dữ liệu từ file JSON
    const data = readJSONFile(filePath);

    // Tìm kiếm index của văn bản cần xóa
    const documentIndex = data.findIndex(doc => doc.id === documentId);

    if (documentIndex === -1) {
        return res.status(404).json({ success: false, message: 'Văn bản không tồn tại.' });
    }

    // Lấy link của tệp tin cần xóa
    const fileLink = data[documentIndex].link;

    // Kiểm tra xem fileLink có hợp lệ hay không
    if (fileLink && typeof fileLink === 'string') {
        // Xử lý đường dẫn tệp tin từ link trong JSON
        let filePathToDelete = path.join(__dirname, '../doc', path.basename(fileLink));  // Đảm bảo đường dẫn chính xác
        if (filePathToDelete.startsWith('\\')) {
            filePathToDelete = filePathToDelete.substring(1);
        }
        // console.log(filePathToDelete);
        // Xóa tệp tin nếu tồn tại
        if (existsSync(filePathToDelete)) {
            unlinkSync(filePathToDelete);  // Xóa tệp tin
            console.log('Tệp tin đã được xóa:', filePathToDelete);
        } else {
            console.log('Tệp tin không tồn tại, bỏ qua việc xóa.');
        }
    } else {
        console.log('Không có tệp tin liên quan hoặc link không hợp lệ, bỏ qua việc xóa tệp.');
    }

    // Xóa văn bản khỏi mảng
    data.splice(documentIndex, 1);
    // Đặt lại ID cho các văn bản còn lại để chúng có ID liên tục
    data.forEach((doc, index) => {
        doc.id = index + 1; // Đặt lại ID để đảm bảo thứ tự liên tục từ 1
    }); // Ghi lại dữ liệu vào file JSON
    writeJSONFile(filePath, data);
    return res.status(200).json({ success: true, message: 'Văn bản và tệp tin đã được xóa.' });
}

// Gọi hàm kiểm tra và gửi email
export async function checkDeadlines() {
    try {
        await daysUntilDeadline(filePath,"Văn bản đến");
        console.log('Đã kiểm tra tất cả các hạn.');
    } catch (error) {
        console.error('Lỗi khi kiểm tra hạn:', error);
    }
}


// Hàm nhận vào ID và gọi hàm cập nhật trạng thái
export function changeDocumentStatusById_den(id) {
    return new Promise((resolve, reject) => {
        // Gọi đến hàm updateDocumentStatus để thay đổi trạng thái
        updateDocumentStatus(id, 'checked', filePath)
            .then(result => {
                // Nếu thành công, trả về thông báo thành công
                resolve({
                    success: true,
                    document: result.document
                });
            })
            .catch(error => {
                // Nếu có lỗi, trả về thông báo lỗi
                reject({
                    success: false,
                    message: `Không thể thay đổi trạng thái văn bản với ID ${id}: ${error}`
                });
            });
    });
}



// Hàm API trả về file CSV
export const getFileCSV = (req, res) => {
    try {
        // Chuyển đổi file JSON thành CSV
        const csvData = convertJSONToCSV(filePath);

        // Cấu hình headers để trả về file CSV với mã hóa UTF-8
        res.header('Content-Type', 'text/csv; charset=utf-8'); // Mã hóa UTF-8
        res.header('Content-Disposition', 'attachment; filename=output.csv'); // Đặt tên file khi tải về

        // Gửi CSV data về cho người dùng, đảm bảo mã hóa UTF-8
        res.send(Buffer.from(csvData, 'utf8'));  // Gửi CSV với UTF-8 encoding

    } catch (error) {
        console.error('Lỗi khi xuất file CSV:', error.message);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xuất file CSV.' });
    }
};