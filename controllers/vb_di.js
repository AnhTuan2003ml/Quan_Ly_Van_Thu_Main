import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import { getEmailById } from './users.js';
import { testSendEmail_multi, testSendEmail_single } from "./sendEmail.js";
import { readJSONFile, readJSONFileID, writeJSONFile, updateDocument_di, addDocument_di,  updateDocumentStatus, convertJSONToCSV } from '../Utils/JsonFile.js';
import {Get_link_vb_den} from './vb_den.js';
import { generateConfirmLink } from './confirm.js';

// Lấy đường dẫn thư mục hiện tại, sửa lại để không có dấu '\' ở đầu
export const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Xử lý đường dẫn sao cho hợp lệ trên hệ thống Windows
export let filePath = path.join(__dirname, '../data/vb_di.json');
// Đảm bảo đường dẫn không có dấu '/' thừa ở đầu
if (filePath.startsWith('\\')) {
    filePath = filePath.substring(1);
}
let  userId;

export const Get_vb_di = async (req, res) => {
    userId = req.session.userId;
    const userRole = req.session.userRole;

    const data = readJSONFile(filePath);

    // Sử dụng async/await để xử lý bất đồng bộ khi gọi Get_link_vb_den
    const updatedData = await Promise.all(data.map(async (doc) => {
        if (doc.lienket !== null) {
            try {
                // Gọi Get_link_vb_den để lấy link từ lienket
                const linkData = await Get_link_vb_den(doc.lienket);

                // Thêm thuộc tính vb_lk mà không thay đổi lienket
                return {
                    ...doc,
                    vb_lk: linkData.link,  // Thêm link vào vb_lk
                };
            } catch (error) {
                // Nếu có lỗi, có thể trả về lienket ban đầu và vb_lk là null
                console.error(`Error fetching link for document with ID: ${doc.lienket}`, error);
                return {
                    ...doc,
                    vb_lk: null,  // Nếu không có link, gán vb_lk là null
                };
            }
        }
        return doc;  // Nếu không có lienket, giữ nguyên tài liệu
    }));

    // Nếu người dùng có role là 'user', chỉ trả về các tài liệu mà người đó phụ trách
    if (userRole === 'user') {
        const userDocuments = updatedData.filter(doc => doc.nguoiphutrach === userId);
        return res.json(userDocuments);
    }

    // Nếu là admin, trả về tất cả dữ liệu đã cập nhật
    return res.json(updatedData);
};


export const Put_vb_di = (req, res) => {
    const documentId = parseInt(req.params.id);
    console.log(req.body);
    const { sovanban_di, ngayphathanh_di, donvitiepnhan, noidung_di, nguoiphutrach, lanhdaoki, BGHduyet, lienket, oldFilePath } = req.body;
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
                    newFilePath = `../doc/${baseName}_${counter}${ext}`;  // Nếu trùng, thêm hậu tố để đổi tên tệp
                }

                // Cập nhật lại đường dẫn tệp
                filePath_doc = newFilePath;
                console.log(`Tên tệp mới: ${filePath_doc}`);
            }
            // Nếu là tệp hiện tại (id giống nhau), không thay đổi tên
        }
        console.log(`Tên tệp : ${filePath_doc}`);
    }


    // Tìm thông tin văn bản cũ (có thể lấy từ cơ sở dữ liệu hoặc từ file JSON)
    readJSONFileID(filePath, parseInt(documentId)) // Giả sử bạn có hàm này để lấy thông tin văn bản cũ
        .then(oldDocument => {
            // So sánh và tạo danh sách các thuộc tính thay đổi
            let token_old;
            let token_new;
            let oldEmail,newEmail;
            if (oldDocument.nguoiphutrach !== parseInt(nguoiphutrach)) {
                oldEmail = getEmailById(oldDocument.nguoiphutrach)
                newEmail = getEmailById(nguoiphutrach)
                token_new = generateConfirmLink(newEmail, 24, oldDocument.id ,"văn bản đi");
                token_old = generateConfirmLink(oldEmail, 24, oldDocument.id ,"văn bản đi");
                //console.log(parseInt(documentId), 'văn bản đi', parseInt(nguoiphutrach), currentDate.toISOString())
            }
            if (!lienket) {
                return null;
            }
            // Cập nhật thông tin văn bản
            updateDocument_di(parseInt(documentId), sovanban_di, ngayphathanh_di, donvitiepnhan, noidung_di, parseInt(nguoiphutrach), parseInt(lanhdaoki), BGHduyet, filePath_doc, parseInt(lienket), filePath)
                .then(() => {
                    res.json({ success: true, message: 'Văn bản đã được cập nhật thành công.' });
                    testSendEmail_multi(oldEmail, newEmail, token_new, token_old);
                })
                .catch(err => {
                    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật văn bản.' });
                }); 
        })
        .catch(err => {
            res.status(500).json({ success: false, message: 'Không tìm thấy văn bản.' });
        });
}

export const Post_vb_di = (req, res) => {
    console.log(req.body);
    const { sovanban_di, ngayphathanh_di, donvitiepnhan, noidung_di, nguoiphutrach,lanhdaoki, BGHduyet,lienket} = req.body;
    const documentFile = req.file; // Tệp mới nếu có
    // Kiểm tra nếu không có tệp mới, sử dụng tệp cũ
    let filePath_doc = documentFile
        ? `../../doc${path.basename(documentFile.filename)}`  // Nếu có tệp mới, lấy tên tệp mới
        :  null;  // Nếu không có tệp mới, lấy đường dẫn cũ nếu có

    // Kiểm tra xem có tệp không
    if (filePath_doc) {
        const data = readJSONFile(filePath);  // Đọc dữ liệu từ file JSON

        const existingDocument = data.find(doc => doc.link === filePath_doc);  // Kiểm tra nếu tệp đã tồn tại trong cơ sở dữ liệu

        if (existingDocument) {
            // Nếu tệp đã tồn tại, nhưng là tệp khác (không phải tệp hiện tại)
            if (existingDocument.id) {
                const ext = path.extname(filePath_doc);  // Lấy phần mở rộng của tệp
                const baseName = path.basename(filePath_doc, ext);  // Lấy tên gốc của tệp (không bao gồm phần mở rộng)

                let counter = 1;
                let newFilePath = `../../doc${baseName}_${counter}${ext}`;  // Đặt tên mới cho tệp

                // Kiểm tra xem tên mới có bị trùng lặp không
                while (data.some(doc => doc.link === newFilePath)) {
                    counter++;
                    newFilePath = `../../doc${baseName}_${counter}${ext}`;  // Nếu trùng, thêm hậu tố để đổi tên tệp
                }

                // Cập nhật lại đường dẫn tệp
                filePath_doc = newFilePath;
                console.log(`Tên tệp mới: ${filePath_doc}`);
            }
            // Nếu là tệp hiện tại (id giống nhau), không thay đổi tên
        }
    }
    let canbosoanthao = '';  // Dùng 'let' thay vì 'const' để có thể thay đổi giá trị sau này


    // Kiểm tra nguoiphutrach nếu không có giá trị thì lấy id của người đăng nhập từ session
    if (!nguoiphutrach) {
        canbosoanthao = userId;  // Nếu nguoiphutrach rỗng, lấy id từ session
    } else {
        canbosoanthao = nguoiphutrach;  // Nếu nguoiphutrach có giá trị, gán canbosoanthao = nguoiphutrach
    }

    console.log(canbosoanthao);




    const newEmail = getEmailById(canbosoanthao);
    let token_new;
    // console.log(newDocument);
    // Thêm văn bản mới vào cơ sở dữ liệu (hoặc file)
    addDocument_di(sovanban_di, ngayphathanh_di, donvitiepnhan, noidung_di, parseInt(canbosoanthao), parseInt(lanhdaoki), BGHduyet, filePath_doc, parseInt(lienket), filePath)
        .then((documentId) => {
            const id_doc = documentId;
            const timestamp = new Date().toISOString(); // Thời gian thay đổi
            // Kiểm tra nếu ngày hết hạn còn lớn hơn ngày hiện tại
            token_new = generateConfirmLink(newEmail, 24, documentId, "văn bản đi");
            testSendEmail_single(newEmail, token_new);
            res.json({ success: true, message: 'Văn bản đi đã được thêm thành công.', documentId: id_doc });
        })
        .catch(err => {
            // Lỗi khi thêm văn bản, trả về phản hồi ngay
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm văn bản đến', error: err.message });
            }
        });
}

export const Delete = (req, res) => {
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
    });
    writeJSONFile(filePath, data);
    return res.status(200).json({ success: true, message: 'Văn bản và tệp tin đã được xóa.' });
}




// Hàm nhận vào ID và gọi hàm cập nhật trạng thái
export function changeDocumentStatusById_di(id) {
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