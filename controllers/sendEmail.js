import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';


dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const createTransporter = async () => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });
    } catch (error) {
        console.log('Lỗi khi tạo transporter:', error);
        throw new Error('Không thể tạo transporter');
    }
};

export const sendEmailNotification = async (to, subject, text, html,token) => {
    try {
        const transporter = await createTransporter();
        // Cập nhật nội dung văn bản (text)
       
        // Cập nhật nội dung HTML với liên kết xác nhận
        const updatedHtml = `
            ${html}
            <p>Vui lòng nhấp vào liên kết dưới đây để xác nhận đã đọc:</p>
            <a href="${token}" target="_blank">${token}</a>
        `;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
            html: updatedHtml
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email đã được gửi thành công đến ${to}!`);
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        throw new Error(`Không thể gửi email đến ${to}`);
    }
};

export const testSendEmail_single = async (newEmail,token) => {
    try {
        const to = newEmail;
        const subject = 'Thông báo';
        const text = `Thêm`;
        const html = `<h1>Thêm</h1>\n\nVui lòng nhấp vào liên kết dưới đây để xác nhận đã đọc:\n${token}`;

        await sendEmailNotification(to, subject, text, html);
        console.log(`Email kiểm tra đã được gửi thành công đến ${to}!`);
    } catch (error) {
        console.error(`Lỗi khi gửi email đến ${newEmail}:`, error);
    }
};

export const testSendEmail_multi = async (oldEmail, newEmail, token_new, token_old) => {
    const recipients = [
        { email: oldEmail, text: 'Hủy', html: '<h1>Hủy</h1>', token: token_old },
        { email: newEmail, text: 'Thêm', html: '<h1>Thêm</h1>', token: token_new },
    ];
    const subject = 'Thông báo';

    try {
        for (const recipient of recipients) {
            // Cập nhật nội dung text và html với token
            const updatedText = `${recipient.text}\n\nVui lòng nhấp vào liên kết dưới đây để xác nhận.:\n`;
            const updatedHtml = `
                ${recipient.html}
                <p>Vui lòng nhấp vào liên kết dưới đây để xác nhận:</p>
                <a href="${recipient.token}" target="_blank">${recipient.token}</a>
            `;

            // Gửi email
            await sendEmailNotification(recipient.email, subject, updatedText, updatedHtml, recipient.token);
        }
    } catch (error) {
        console.error('Lỗi khi gửi email kiểm tra:', error);
    }
};
