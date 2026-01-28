// ============================================
// SQLite Veritabanı Konfigürasyonu
// ============================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'turizm.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanı hatası:', err);
    } else {
        console.log('✓ Veritabanına bağlandı');
        initializeDatabase();
    }
});

// ============================================
// Veritabanı Başlatma
// ============================================

function initializeDatabase() {
    db.serialize(() => {
        // Users Tablosu
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Places Tablosu (Turistik Yerler)
        db.run(`
            CREATE TABLE IF NOT EXISTS places (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                category TEXT,
                rating REAL DEFAULT 5.0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Favorites Tablosu (Favoriler)
        db.run(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                place_id INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
            )
        `);

        // Reviews Tablosu (Yorumlar)
        db.run(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                place_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER,
                comment TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Contact Messages Tablosu (İletişim Mesajları)
        db.run(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Demo Verileri Ekle
        insertSampleData();
    });
}

// ============================================
// Demo Verileri
// ============================================

function insertSampleData() {
    // Örnek kullanıcılar
    const users = [
        { name: 'Ahmet Yılmaz', email: 'ahmet@example.com', password: '123456' },
        { name: 'Fatma Çelik', email: 'fatma@example.com', password: '123456' },
        { name: 'Can Kaya', email: 'can@example.com', password: '123456' }
    ];

    users.forEach(user => {
        db.run(
            'INSERT OR IGNORE INTO users (name, email, password) VALUES (?, ?, ?)',
            [user.name, user.email, user.password]
        );
    });

    // Örnek yerler
    const places = [
        {
            name: 'Kapadokya',
            city: 'Nevşehir',
            description: 'Eşsiz kaya formasyonları ve balonla yapılan turlarla dünya ünlü Kapadokya.',
            category: 'doğa',
            rating: 4.9
        },
        {
            name: 'Ölüdeniz',
            city: 'Muğla',
            description: 'Turkuaz suları ve kumsal plajıyla Türkiye\'nin en güzel sahili.',
            category: 'sahil',
            rating: 4.8
        },
        {
            name: 'Pamukkale',
            city: 'Denizli',
            description: 'Beyaz travertenleri ve termal sularıyla UNESCO Dünya Mirası alanı.',
            category: 'tarih',
            rating: 4.9
        },
        {
            name: 'Galata Kulesi',
            city: 'İstanbul',
            description: 'İstanbul\'un ikonik yapısı, harika panoramik görüntüler sunan tarihi kule.',
            category: 'şehir',
            rating: 4.7
        },
        {
            name: 'Efes Antik Kenti',
            city: 'İzmir',
            description: 'Antik dönemin en önemli şehirlerinden biri, Artemis Tapınağı\'nın konumlandığı yer.',
            category: 'tarih',
            rating: 4.9
        }
    ];

    places.forEach(place => {
        db.run(
            'INSERT OR IGNORE INTO places (name, city, description, category, rating) VALUES (?, ?, ?, ?, ?)',
            [place.name, place.city, place.description, place.category, place.rating]
        );
    });

    console.log('✓ Demo veriler yüklendi');
}

// ============================================
// Veritabanı Fonksiyonları (Promis wrapper)
// ============================================

const dbAsync = {
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
};

// ============================================
// Export
// ============================================

module.exports = db;
module.exports.async = dbAsync;
