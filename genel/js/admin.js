// ============================================
// Admin Panel - Tam CRUD Sistemi (Çalışır + Görsel)
// ============================================

let editingId = null;
let placesData = [];

// Element seçme
const el = (id) => document.getElementById(id);

// HTML elementleri
const titleEl = el("title");
const cityEl = el("city");
const categoryEl = el("category");
const imageEl = el("image_url");
const descEl = el("description");

const addBtn = el("addBtn");
const updateBtn = el("updateBtn");
const cancelBtn = el("cancelBtn");
const msgEl = el("msg");

// ============================================
// Mesaj gösterme
// ============================================
function setMsg(text, isSuccess = true) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color = isSuccess ? "#8ff0d1" : "#ffb4b4";
  msgEl.style.fontWeight = "bold";
}

// ============================================
// Formu temizle
// ============================================
function clearForm() {
  editingId = null;
  titleEl.value = "";
  cityEl.value = "";
  categoryEl.value = "";
  imageEl.value = "";
  descEl.value = "";
  updateBtn.disabled = true;
  cancelBtn.disabled = true;
  addBtn.disabled = false;
  msgEl.textContent = "";
}

// ============================================
// Form verisi al
// ============================================
function getPayload() {
  return {
    title: titleEl.value.trim(),
    city: cityEl.value.trim(),
    category: categoryEl.value.trim(),
    image_url: imageEl.value.trim(),
    description: descEl.value.trim(),
  };
}

// ============================================
// HTML güvenli hale getir (XSS)
// ============================================
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// ============================================
// YERLERİ YÜKLE (READ)
// ============================================
async function loadPlaces() {
  try {
    const r = await fetch("/api/admin/places");
    const j = await r.json();

    if (!j.ok) {
      setMsg(j.error || "Yerler yüklenemedi", false);
      return;
    }

    placesData = j.data || [];
    const tb = el("placesTbody");

    if (placesData.length === 0) {
      tb.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;opacity:.6">
            Henüz yer eklenmemiş.
          </td>
        </tr>`;
      return;
    }

    tb.innerHTML = placesData.map(p => `
      <tr>
        <td>${p.id}</td>

        <td>
          ${p.image_url ? `
            <img 
              src="${escapeHtml(p.image_url)}"
              style="width:90px;height:60px;object-fit:cover;border-radius:10px;"
              onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'"
            >
          ` : '<span style="opacity:.5">Yok</span>'}
        </td>

        <td><b>${escapeHtml(p.title)}</b></td>
        <td>${escapeHtml(p.city)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td class="small">${escapeHtml(p.description)}</td>

        <td>
          <button class="btn btn-sm"
            onclick="window.editPlace(${p.id})"
            style="margin-right:5px;">✎ Düzenle</button>

          <button class="btn btn-sm btn-soft btn-dangerx"
            onclick="window.deletePlace(${p.id})">🗑 Sil</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    setMsg("Yerler yüklenirken hata: " + err.message, false);
  }
}

// ============================================
// DÜZENLE (EDIT)
// ============================================
window.editPlace = function(id) {
  const p = placesData.find(x => x.id === id);
  if (!p) {
    setMsg("Yer bulunamadı", false);
    return;
  }

  editingId = p.id;
  titleEl.value = p.title || "";
  cityEl.value = p.city || "";
  categoryEl.value = p.category || "";
  imageEl.value = p.image_url || "";
  descEl.value = p.description || "";

  addBtn.disabled = true;
  updateBtn.disabled = false;
  cancelBtn.disabled = false;
  setMsg(`✏️ Düzenleme modu (ID: ${p.id})`, true);
};

// ============================================
// SİL (DELETE)
// ============================================
window.deletePlace = async (id) => {
  if (!confirm("Silmek istediğine emin misin?")) return;

  try {
    const r = await fetch(`/api/admin/places/${id}`, { method: "DELETE" });
    const j = await r.json();

    if (!j.ok) {
      setMsg(j.error || "Silinemedi", false);
      return;
    }

    setMsg("✅ Silindi!", true);
    await loadPlaces();

  } catch (err) {
    setMsg("Silme hatası: " + err.message, false);
  }
};

// ============================================
// EKLE (CREATE)
// ============================================
addBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const body = getPayload();
  if (!body.title || !body.city || !body.category || !body.description) {
    setMsg("❌ Zorunlu alanlar boş", false);
    return;
  }

  try {
    const r = await fetch("/api/admin/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    if (!j.ok) {
      setMsg(j.error || "Eklenemedi", false);
      return;
    }

    setMsg("✅ Eklendi!", true);
    clearForm();
    await loadPlaces();

  } catch (err) {
    setMsg("Ekleme hatası: " + err.message, false);
  }
});

// ============================================
// GÜNCELLE (UPDATE)
// ============================================
updateBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!editingId) {
    setMsg("❌ Seçim yok", false);
    return;
  }

  const body = getPayload();

  try {
    const r = await fetch(`/api/admin/places/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json();
    if (!j.ok) {
      setMsg(j.error || "Güncellenemedi", false);
      return;
    }

    setMsg("✅ Güncellendi!", true);
    clearForm();
    await loadPlaces();

  } catch (err) {
    setMsg("Güncelleme hatası: " + err.message, false);
  }
});

// ============================================
// İPTAL
// ============================================
cancelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  clearForm();
  setMsg("İptal edildi.", true);
});

// ============================================
// MESAJLARI YÜKLE
// ============================================
async function loadMessages() {
  try {
    const r = await fetch("/api/admin/messages");
    const j = await r.json();
    if (!j.ok) return;

    const tb = el("messagesTbody");
    const messages = j.data || [];

    if (messages.length === 0) {
      tb.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;opacity:.6">
            Henüz mesaj yok.
          </td>
        </tr>`;
      return;
    }

    tb.innerHTML = messages.map(m => `
      <tr>
        <td>${m.id}</td>
        <td><b>${escapeHtml(m.name)}</b></td>
        <td>${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.topic)}</td>
        <td>${escapeHtml(m.city)}</td>
        <td class="small">${escapeHtml(m.message)}</td>
        <td class="small">${new Date(m.created_at).toLocaleString("tr-TR")}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error(err);
  }
}

// ============================================
// BAŞLAT
// ============================================
(async function init() {
  clearForm();
  await loadPlaces();
  await loadMessages();
  setMsg("✅ Admin Panel hazır!", true);
})();

// =====================================================
// EK: Fotoğraf Yükleme (Upload) + URL'yi image_url'a yaz
// =====================================================

// Yeni elementleri al (HTML'e eklediğin id'ler)
const imageFileEl = document.getElementById("image_file");
const uploadBtnEl = document.getElementById("uploadBtn");
const uploadMsgEl = document.getElementById("uploadMsg");

// Upload mesajı göster
function setUploadMsg(text, ok = true) {
  if (!uploadMsgEl) return;
  uploadMsgEl.textContent = text;
  uploadMsgEl.style.color = ok ? "#8ff0d1" : "#ffb4b4";
  uploadMsgEl.style.fontWeight = "bold";
}

// Upload yapıp URL döndürür
async function uploadImageIfSelected() {
  // Elementler yoksa ya da dosya seçilmediyse boş döner (hata değil)
  if (!imageFileEl || !imageFileEl.files || imageFileEl.files.length === 0) {
    return null;
  }

  const file = imageFileEl.files[0];

  if (!file || !file.type || !file.type.startsWith("image/")) {
    setUploadMsg("❌ Lütfen bir görsel dosyası seç.", false);
    throw new Error("Seçilen dosya görsel değil.");
  }

  const fd = new FormData();
  fd.append("image", file);

  try {
    if (uploadBtnEl) uploadBtnEl.disabled = true;
    setUploadMsg("Yükleniyor...");

    const res = await fetch("/api/upload", { method: "POST", body: fd });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setUploadMsg("❌ Upload başarısız.", false);
      throw new Error(t || "Upload başarısız");
    }

    const data = await res.json();

    if (!data || !data.url) {
      setUploadMsg("❌ Sunucu URL döndürmedi.", false);
      throw new Error("Sunucu URL döndürmedi");
    }

    // URL inputunu doldur (senin mevcut image_url inputun: imageEl)
    if (typeof imageEl !== "undefined" && imageEl) {
      imageEl.value = data.url;
    }

    setUploadMsg("✅ Yüklendi! (URL eklendi)", true);
    return data.url;

  } finally {
    if (uploadBtnEl) uploadBtnEl.disabled = false;
  }
}

// Fotoğrafı Yükle butonu
if (uploadBtnEl) {
  uploadBtnEl.addEventListener("click", async () => {
    try {
      await uploadImageIfSelected();
    } catch (e) {
      // hata mesajı zaten setUploadMsg ile veriliyor
      console.error(e);
    }
  });
}

// =====================================================
// EK: Tek tık kayıt (Ekle/Güncelle basınca önce upload)
// Mevcut koduna dokunmadan yakalayıp önce çalıştırırız
// =====================================================

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    // Eğer dosya seçiliyse önce upload yap (sonra senin mevcut addBtn listener'ın zaten çalışacak)
    try {
      if (imageFileEl && imageFileEl.files && imageFileEl.files.length > 0) {
        await uploadImageIfSelected();
      }
    } catch (e) {
      // Upload başarısızsa eklemeyi durdurmak için:
      // NOT: bu listener mevcut listener'dan önce/sonra çalışabilir.
      // Bu yüzden kullanıcıyı uyarıyoruz. (backend yoksa zaten upload olmaz)
      setMsg("❌ Fotoğraf yüklenemedi, önce upload'u düzelt.", false);
      console.error(e);
    }
  }, true); // capture=true -> önce upload denesin
}

if (updateBtn) {
  updateBtn.addEventListener("click", async () => {
    try {
      if (imageFileEl && imageFileEl.files && imageFileEl.files.length > 0) {
        await uploadImageIfSelected();
      }
    } catch (e) {
      setMsg("❌ Fotoğraf yüklenemedi, önce upload'u düzelt.", false);
      console.error(e);
    }
  }, true);
}
