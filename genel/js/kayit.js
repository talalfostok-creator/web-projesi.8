// ============================================
// Kayıt Formu İşleme
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const bio = document.getElementById('bio') ? document.getElementById('bio').value.trim() : '';
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Doğrulama
    if (!fullName || !email || !password) {
        showAlert('registerMessage', 'Lütfen zorunlu alanları doldurun', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showAlert('registerMessage', 'Geçerli bir e-mail adresi girin', 'error');
        return;
    }

    if (!validatePassword(password)) {
        showAlert('registerMessage', 'Şifre en az 6 karakter olmalıdır', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showAlert('registerMessage', 'Şifreler eşleşmiyor', 'error');
        return;
    }

    if (!agreeTerms) {
        showAlert('registerMessage', 'Koşulları kabul etmelisiniz', 'error');
        return;
    }

    // API Kayıt
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: fullName, 
                email, 
                password,
                phone,
                bio
            })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
            showAlert('registerMessage', data.error || 'Kayıt başarısız', 'error');
            return;
        }
        
        showAlert('registerMessage', 'Kayıt başarılı! Başlangıç sayfasına yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
            window.location.href = 'giris.html';
        }, 1500);
    } catch (error) {
        showAlert('registerMessage', 'Bağlantı hatası: ' + error.message, 'error');
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
