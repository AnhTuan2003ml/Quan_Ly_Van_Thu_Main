// Middleware kiểm tra đăng nhập
export function ensureAuthenticated(req, res, next) {
    // console.log(req.session); // Kiểm tra session có tồn tại không
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập trước' });
    }
    next();
}

export default ensureAuthenticated;