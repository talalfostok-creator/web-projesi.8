const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");

const app = express();
const PORT = 3000;

const PUBLIC_DIR = path.join(__dirname, "genel");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/** =======================
 *  ADMIN KİMLİK BİLGİLERİ
 *  ======================= */
const ADMIN_EMAIL = "admin@mail.com";
const ADMIN_PASS = "1234";

/** =======================
 *  DB
 *  ======================= */
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      city TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      topic TEXT NOT NULL,
      city TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
});

/** =======================
 *  Middlewares
 *  ======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "turizm_rehberi_secret_123",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 6 },
  })
);

app.use(express.static(PUBLIC_DIR));

// Ana sayfa yönlendirmesi
app.get("/", (req, res) => {
  res.redirect("/html/anasayfa.html");
});
/** =======================
 *  UPLOAD (Görsel Yükleme)
 *  ======================= */
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads"); // genel/uploads
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// uploads klasörünü dışarı aç (http://localhost:3000/uploads/...)
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: function (req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Sadece resim dosyası yükleyebilirsin."));
    }
    cb(null, true);
  },
});

// Upload endpoint (Admin gerekli)
app.post("/api/upload", requireAdmin, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Dosya gelmedi." });
    }
    return res.json({ ok: true, url: `/uploads/${req.file.filename}` });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/** =======================
 *  Auth Helpers
 *  ======================= */
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ ok: false, error: "Giriş gerekli." });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Admin yetkisi gerekli." });
  }
  next();
}

/** =======================
 *  Login / Register
 *  ======================= */
app.post("/api/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();

  if (!email || !password) return res.status(400).json({ ok: false, error: "E-posta ve şifre zorunlu." });

  // ADMIN
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    req.session.user = { role: "admin", email };
    return res.json({ ok: true, role: "admin" });
  }

  // NORMAL USER (SQLite)
  db.get("SELECT id, email FROM users WHERE email=? AND password=?", [email, password], (err, row) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    if (!row) return res.status(401).json({ ok: false, error: "E-posta veya şifre yanlış." });

    req.session.user = { role: "user", email: row.email, userId: row.id };
    res.json({ ok: true, role: "user" });
  });
});

app.post("/api/register", (req, res) => {
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "").trim();
  const bio = String(req.body.bio || "").trim();

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: "Ad Soyad, e-posta ve şifre zorunlu." });
  }

  db.run(
    "INSERT INTO users(name, phone, email, password, bio) VALUES(?,?,?,?,?)",
    [name, phone, email, password, bio],
    function (err) {
      if (err) {
        if (String(err.message).includes("UNIQUE")) {
          return res.status(409).json({ ok: false, error: "Bu e-posta zaten kayıtlı." });
        }
        return res.status(500).json({ ok: false, error: err.message });
      }
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/** =======================
 *  Admin sayfası (Gizli)
 *  ======================= */
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "html", "admin.html"));
});

/** =======================
 *  PUBLIC PLACES (kullanıcı)
 *  ======================= */
app.get("/api/places", (req, res) => {
  db.all("SELECT * FROM places ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, data: rows });
  });
});

/** =======================
 *  ADMIN CRUD (places)
 *  ======================= */
app.get("/api/admin/places", requireAdmin, (req, res) => {
  db.all("SELECT * FROM places ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, data: rows });
  });
});

app.post("/api/admin/places", requireAdmin, (req, res) => {
  const title = String(req.body.title || "").trim();
  const city = String(req.body.city || "").trim();
  const category = String(req.body.category || "").trim();
  const description = String(req.body.description || "").trim();
  const image_url = String(req.body.image_url || "").trim();

  if (!title || !city || !category || !description) {
    return res.status(400).json({ ok: false, error: "Zorunlu alanlar eksik." });
  }

  db.run(
    `INSERT INTO places(title, city, category, description, image_url) VALUES(?,?,?,?,?)`,
    [title, city, category, description, image_url],
    function (err) {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put("/api/admin/places/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const title = String(req.body.title || "").trim();
  const city = String(req.body.city || "").trim();
  const category = String(req.body.category || "").trim();
  const description = String(req.body.description || "").trim();
  const image_url = String(req.body.image_url || "").trim();

  if (!id || !title || !city || !category || !description) {
    return res.status(400).json({ ok: false, error: "Geçersiz veri." });
  }

  db.run(
    `UPDATE places SET title=?, city=?, category=?, description=?, image_url=? WHERE id=?`,
    [title, city, category, description, image_url, id],
    function (err) {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      if (this.changes === 0) return res.status(404).json({ ok: false, error: "Kayıt bulunamadı." });
      res.json({ ok: true });
    }
  );
});

app.delete("/api/admin/places/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "Geçersiz id." });

  db.run("DELETE FROM places WHERE id=?", [id], function (err) {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ ok: false, error: "Kayıt bulunamadı." });
    res.json({ ok: true });
  });
});

/** =======================
 *  CONTACT (İletişim Formu)
 *  ======================= */
app.post("/api/contact", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const topic = String(req.body.topic || "").trim();
  const city = String(req.body.city || "").trim();
  const message = String(req.body.message || "").trim();

  if (!name || !email || !topic || !city || !message) {
    return res.status(400).json({ ok: false, error: "Tüm alanlar zorunlu." });
  }

  db.run(
    `INSERT INTO messages(name, email, topic, city, message) VALUES(?, ?, ?, ?, ?)`,
    [name, email, topic, city, message],
    function (err) {
      if (err) return res.status(500).json({ ok: false, error: err.message });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

// Admin mesaj listesi
app.get("/api/admin/messages", requireAdmin, (req, res) => {
  db.all("SELECT * FROM messages ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, data: rows });
  });
});

/** =======================
 *  Start
 *  ======================= */
app.listen(PORT, () => {
  console.log(`Ana Sayfa: http://localhost:${PORT}/html/anasayfa.html`);
  console.log(`Giriş:     http://localhost:${PORT}/html/giris.html`);
  console.log(`Turistik:  http://localhost:${PORT}/html/turistik-yerler.html`);
  console.log(`İletişim:  http://localhost:${PORT}/html/iletisim.html`);
  console.log(`Admin:     http://localhost:${PORT}/admin (login + admin gerekli)`);
});
