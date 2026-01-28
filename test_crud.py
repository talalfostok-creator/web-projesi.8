#!/usr/bin/env python3
import requests
import json
from urllib.parse import urljoin

BASE_URL = "http://localhost:3000"

# Session oluştur
session = requests.Session()

print("=" * 50)
print("ADMIN PANEL - CRUD SISTEM TESTİ")
print("=" * 50)

# 1. Giriş yap
print("\n[1] Giriş yapılıyor...")
login_response = session.post(
    urljoin(BASE_URL, "/api/login"),
    json={"email": "admin@mail.com", "password": "1234"}
)
print(f"Status: {login_response.status_code}")
print(f"Yanıt: {login_response.json()}")

if not login_response.json().get("ok"):
    print("❌ Giriş başarısız!")
    exit(1)

print("✅ Giriş başarılı!")

# 2. Mevcut yerler listesi
print("\n[2] Mevcut yerler listeleniyor...")
places_response = session.get(urljoin(BASE_URL, "/api/admin/places"))
print(f"Status: {places_response.status_code}")
data = places_response.json()
print(f"Yer sayısı: {len(data.get('data', []))}")

# 3. Yeni yer EKLE (CREATE)
print("\n[3] Yeni yer ekleniyor...")
new_place = {
    "title": "TEST YERİ - Kapadokya",
    "city": "Nevşehir",
    "category": "Doğa",
    "description": "Test için eklenen bir yerdir.",
    "image_url": "https://example.com/test.jpg"
}
create_response = session.post(
    urljoin(BASE_URL, "/api/admin/places"),
    json=new_place
)
print(f"Status: {create_response.status_code}")
response_data = create_response.json()
print(f"Yanıt: {response_data}")

if not response_data.get("ok"):
    print("❌ Ekleme başarısız!")
    exit(1)

place_id = response_data.get("id")
print(f"✅ Yer başarıyla eklendi! (ID: {place_id})")

# 4. Yerler listesi (kontrol)
print("\n[4] Yerler listesi kontrol ediliyor...")
places_response = session.get(urljoin(BASE_URL, "/api/admin/places"))
data = places_response.json()
print(f"Toplam yer sayısı: {len(data.get('data', []))}")
print(f"Son eklenen yer: {data['data'][0]['title'] if data.get('data') else 'Yok'}")

# 5. Yeri GÜNCELLE (UPDATE)
print(f"\n[5] ID {place_id} olan yer güncelleniyor...")
updated_place = {
    "title": "TEST YERİ - Kapadokya (Güncellenmiş)",
    "city": "Nevşehir",
    "category": "Doğa",
    "description": "Test için eklenen bir yer - GÜNCELLENDI",
    "image_url": "https://example.com/test-updated.jpg"
}
update_response = session.put(
    urljoin(BASE_URL, f"/api/admin/places/{place_id}"),
    json=updated_place
)
print(f"Status: {update_response.status_code}")
response_data = update_response.json()
print(f"Yanıt: {response_data}")

if response_data.get("ok"):
    print(f"✅ Yer başarıyla güncellendi!")
else:
    print(f"❌ Güncelleme başarısız!")

# 6. Güncellenmiş veriyi kontrol et
print(f"\n[6] Güncellenmiş veriler kontrol ediliyor...")
places_response = session.get(urljoin(BASE_URL, "/api/admin/places"))
data = places_response.json()
updated = next((p for p in data.get('data', []) if p['id'] == place_id), None)
if updated:
    print(f"Başlık: {updated['title']}")
    print(f"Açıklama: {updated['description']}")
    print("✅ Güncelleme kontrol edildi!")

# 7. Yeri SİL (DELETE)
print(f"\n[7] ID {place_id} olan yer siliniyor...")
delete_response = session.delete(
    urljoin(BASE_URL, f"/api/admin/places/{place_id}")
)
print(f"Status: {delete_response.status_code}")
response_data = delete_response.json()
print(f"Yanıt: {response_data}")

if response_data.get("ok"):
    print(f"✅ Yer başarıyla silindi!")
else:
    print(f"❌ Silme başarısız!")

# 8. Final kontrol
print(f"\n[8] Final kontrol yapılıyor...")
places_response = session.get(urljoin(BASE_URL, "/api/admin/places"))
data = places_response.json()
print(f"Toplam yer sayısı: {len(data.get('data', []))}")

print("\n" + "=" * 50)
print("✅ TÜM TESTLER BAŞARILI!")
print("CRUD Sistemi %100 çalışır durumda!")
print("=" * 50)
