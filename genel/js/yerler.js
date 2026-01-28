async function loadPlaces() {
  const grid = document.getElementById("placesGrid");
  grid.innerHTML = `<div style="opacity:.85">Yükleniyor...</div>`;

  const r = await fetch("/api/places");
  const j = await r.json();

  if (!j.ok) {
    grid.innerHTML = `<div style="color:#ffb4b4">Veriler alınamadı: ${j.error || ""}</div>`;
    return;
  }

  const items = j.data || [];
  if (!items.length) {
    grid.innerHTML = `<div style="opacity:.85">Henüz turistik yer eklenmemiş.</div>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <div class="place-card">
      <div class="place-img" style="background-image:url('${p.image_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"}')"></div>
      <div class="place-body">
        <div class="place-title">${escapeHtml(p.title)}</div>
        <div class="place-meta">${escapeHtml(p.city)} • ${escapeHtml(p.category)}</div>
        <div class="place-desc">${escapeHtml(p.description)}</div>
        <button class="btn-detail" onclick='showDetail(${encodeURIComponent(JSON.stringify(p))})'>Detaylı</button>
      </div>
    </div>
  `).join("");
}

window.showDetail = (pStr) => {
  const p = JSON.parse(decodeURIComponent(pStr));
  alert(`${p.title}\n\nŞehir: ${p.city}\nKategori: ${p.category}\n\n${p.description}`);
};

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

loadPlaces();
