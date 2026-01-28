// ============================================
// Kimlik Doğrulama Middleware
// ============================================

// Token kontrol middleware'i
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token eksik' });
    }

    // Basit token doğrulama (Gerçek uygulamada JWT kullanılması önerilir)
    if (token.startsWith('token_')) {
        req.userId = token;
        next();
    } else {
        res.status(401).json({ error: 'Geçersiz token' });
    }
};

// E-mail ve şifre doğrulama
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => {
    // Şifre en az 6 karakter olmalı
    return password && password.length >= 6;
};

// Oturum kontrolü
const checkSession = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token && token.startsWith('token_')) {
        req.isAuthenticated = true;
        next();
    } else {
        req.isAuthenticated = false;
        next();
    }
};

// Role-based access control (RBAC)
const requireRole = (role) => {
    return (req, res, next) => {
        const userRole = req.userRole || 'user'; // Varsayılan kullanıcı
        
        if (userRole === role || userRole === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Yetkiniz yok' });
        }
    };
};

// ============================================
// Export
// ============================================

module.exports = verifyToken;
module.exports.validateEmail = validateEmail;
module.exports.validatePassword = validatePassword;
module.exports.checkSession = checkSession;
module.exports.requireRole = requireRole;
