// ============================================
// Oturum ve Token Yönetimi
// ============================================

function tokenGet() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("favorites");
  window.location.href = "giris.html";
}

function protectPage() {
  const t = tokenGet();
  if (!t && !localStorage.getItem('isLoggedIn')) {
    window.location.href = "giris.html";
  }
}

// ============================================
// Kullanıcı Yönetimi
// ============================================

const authManager = {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,

    login(email, password) {
        if (email && password) {
            const user = { email, name: email.split('@')[0] };
            const token = 'token_' + Date.now();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', token);
            localStorage.setItem('username', user.name);
            this.isLoggedIn = true;
            this.currentUser = user;
            this.updateUI();
            return true;
        }
        return false;
    },

    logout() {
        logout();
    },

    register(fullName, email, password) {
        if (fullName && email && password) {
            const user = { email, name: fullName };
            const token = 'token_' + Date.now();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', token);
            localStorage.setItem('username', user.name);
            this.isLoggedIn = true;
            this.currentUser = user;
            this.updateUI();
            return true;
        }
        return false;
    },

    updateUI() {
        const loginLink = document.getElementById('loginLink');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.isLoggedIn && this.currentUser && loginLink && logoutBtn) {
            loginLink.style.display = 'none';
            logoutBtn.style.display = 'block';
            logoutBtn.textContent = `${this.currentUser.name} (Çıkış)`;
        } else if (loginLink && logoutBtn) {
            loginLink.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    }
};

// ============================================
// Favoriler Yönetimi
// ============================================
const favoriteManager = {
    get favorites() {
        return JSON.parse(localStorage.getItem('favorites')) || [];
    },

    set favorites(value) {
        localStorage.setItem('favorites', JSON.stringify(value));
    },

    addFavorite(placeId, placeName) {
        if (!authManager.isLoggedIn) {
            alert('Lütfen önce giriş yapın');
            window.location.href = 'giris.html';
            return false;
        }

        const favorites = this.favorites;
        if (!favorites.find(f => f.id === placeId)) {
            favorites.push({ id: placeId, name: placeName, date: new Date().toLocaleDateString('tr-TR') });
            this.favorites = favorites;
            return true;
        }
        return false;
    },

    removeFavorite(placeId) {
        const favorites = this.favorites.filter(f => f.id !== placeId);
        this.favorites = favorites;
    },

    isFavorite(placeId) {
        return this.favorites.some(f => f.id === placeId);
    }
};

// ============================================
// Utility Fonksiyonları
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showAlert(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    element.innerHTML = '';
    element.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// ============================================
// Başlangıç
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    authManager.updateUI();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                authManager.logout();
            }
        });
    }
});
