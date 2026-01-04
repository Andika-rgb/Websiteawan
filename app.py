from flask import Flask, render_template, request, jsonify, Response, redirect, url_for
import sqlite3
import os
import csv
from io import StringIO
from datetime import datetime

app = Flask(__name__)

# Nama file database
DB_NAME = "database.db"

# Kredensial Admin (Ganti sesuai kebutuhan)
ADMIN_CREDENTIALS = {
    "admin": "admin123",
    "superadmin": "super123"
}

# --- BAGIAN DATABASE ---
def init_db():
    """Membuat tabel database otomatis sesuai field di HTML Anda"""
    if not os.path.exists(DB_NAME):
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Tabel Orders (disesuaikan dengan form index.html)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                name TEXT,
                whatsapp TEXT,
                service TEXT,
                deadline TEXT,
                description TEXT,
                price INTEGER,
                status TEXT,
                date TEXT,
                review TEXT
            )
        ''')
        conn.commit()
        conn.close()
        print("Database berhasil dibuat!")

# Jalankan saat aplikasi mulai
init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row # Agar bisa akses kolom pakai nama (row['name'])
    return conn

# --- BAGIAN ROUTE HALAMAN (HTML) ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin/login')
def admin_login_page():
    return render_template('login.html')

@app.route('/admin')
def admin_page():
    # Redirect ke login jika belum login (ini cuma proteksi dasar)
    return render_template('admin.html')

# --- BAGIAN API ADMIN LOGIN ---

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    
    # Verifikasi kredensial
    if username in ADMIN_CREDENTIALS and ADMIN_CREDENTIALS[username] == password:
        return jsonify({
            "success": True,
            "message": "Login berhasil!",
            "username": username
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Username atau password salah!"
        }), 401

# --- BAGIAN API ORDERS ---

# 1. API: Simpan Order Baru (Dari script.js)
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO orders (id, name, whatsapp, service, deadline, description, price, status, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['orderId'], data['name'], data['whatsapp'], data['service'], 
            data['deadline'], data['description'], data['price'], 
            data['status'], data['timestamp']
        ))
        conn.commit()
        return jsonify({"message": "Order sukses!", "id": data['orderId']}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# 2. API: Ambil Semua Order (Untuk Admin & Lacak Pesanan)
@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders').fetchall()
    conn.close()
    
    # Ubah format database ke format JSON yang dimengerti JS Anda
    orders_list = []
    for row in orders:
        orders_list.append({
            "orderId": row['id'],
            "name": row['name'],
            "whatsapp": row['whatsapp'],
            "service": row['service'],
            "deadline": row['deadline'],
            "description": row['description'],
            "price": row['price'],
            "status": row['status'],
            "timestamp": row['date'],
            "review": row['review']
        })
    return jsonify(orders_list)

# 3. API: Update Status (Untuk Admin)
@app.route('/api/orders/update-status', methods=['POST'])
def update_status():
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE orders SET status = ? WHERE id = ?', (data['status'], data['orderId']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Status updated"})

# 4. API: Hapus Order (Untuk Admin)
@app.route('/api/orders/delete', methods=['POST'])
def delete_order():
    data = request.json
    conn = get_db_connection()
    conn.execute('DELETE FROM orders WHERE id = ?', (data['orderId'],))
    conn.commit()
    conn.close()
    return jsonify({"message": "Order deleted"})

# 5. API: Kirim Review (Dari script.js)
@app.route('/api/orders/review', methods=['POST'])
def submit_review():
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE orders SET review = ? WHERE id = ?', (data['review'], data['orderId']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Review submitted"})

# 6. API: Export CSV
@app.route('/api/orders/export-csv', methods=['GET'])
def export_csv():
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders ORDER BY date DESC').fetchall()
    conn.close()
    
    # Buat CSV di memory
    output = StringIO()
    writer = csv.writer(output)
    
    # Header CSV
    writer.writerow(['Order ID', 'Nama', 'WhatsApp', 'Layanan', 'Deadline', 'Deskripsi', 'Harga', 'Status', 'Tanggal Order', 'Review'])
    
    # Data rows
    for order in orders:
        writer.writerow([
            order['id'],
            order['name'],
            order['whatsapp'],
            order['service'],
            order['deadline'],
            order['description'],
            order['price'],
            order['status'],
            order['date'],
            order['review'] or '-'
        ])
    
    # Kirim sebagai file download
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=pesanan_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'}
    )

if __name__ == '__main__':
    app.run(debug=True)