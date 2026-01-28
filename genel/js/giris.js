// ============================================
// Giriş Formu İşleme
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Hatırlanmış e-mail'i göster
    const rememberEmail = localStorage.getItem('rememberEmail');
    if (rememberEmail) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = rememberEmail;
            const rememberCheckbox = document.getElementById('rememberMe');
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Doğrulama
    if (!email || !password) {
        showAlert('loginMessage', 'Lütfen tüm alanları doldurun', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showAlert('loginMessage', 'Geçerli bir e-mail adresi girin', 'error');
        return;
    }

    if (!validatePassword(password)) {
        showAlert('loginMessage', 'Şifre en az 6 karakter olmalıdır', 'error');
        return;
    }

    // API Giriş
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            showAlert('loginMessage', data.error || 'Giriş başarısız', 'error');
            return;
        }
        
        // Hatırla
        if (rememberMe) {
            localStorage.setItem('rememberEmail', email);
        }
        
        showAlert('loginMessage', 'Başarıyla giriş yaptınız! Yönlendiriliyorsunuz...', 'success');
        
        // Admin ise admin paneline, değilse ana sayfaya yönlendir
        setTimeout(() => {
            if (data.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = 'anasayfa.html';
            }
        }, 1500);
    } catch (error) {
        showAlert('loginMessage', 'Bağlantı hatası: ' + error.message, 'error');
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showAlert(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'alert ' + type;
        element.style.display = 'block';
    }
}
