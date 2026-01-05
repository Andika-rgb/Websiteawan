import mysql.connector

# Konfigurasi sama persis dengan app.py
DB_CONFIG = {
    'host': 'ajimex-design.mysql.database.azure.com',
    'user': 'Sqladmin',
    'password': 'Admin_123',
    'database': 'designku_db',
    'port': 3306
}

# Perintah SQL membuat tabel (Sesuaikan kolom dengan app.py kamu)
CREATE_TABLE_QUERY = """
CREATE TABLE IF NOT EXISTS pesanan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_pemesan VARCHAR(255) NOT NULL,
    kategori VARCHAR(100),
    deskripsi TEXT,
    deadline DATE,
    tanggal_pesan DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending'
);
"""

try:
    print("Sedang menghubungkan ke Azure...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("Sedang membuat tabel 'pesanan'...")
    cursor.execute(CREATE_TABLE_QUERY)
    conn.commit()
    
    print("✅ SUKSES! Tabel 'pesanan' berhasil dibuat.")
    
except Exception as e:
    print(f"❌ GAGAL: {e}")
    
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()