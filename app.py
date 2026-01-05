from flask import Flask, render_template, request, jsonify, Response
import mysql.connector
from mysql.connector import Error
import os
import csv
from io import StringIO
from datetime import datetime

app = Flask(__name__)

# ===== KONFIGURASI DATABASE AZURE MYSQL =====
# ===== KONFIGURASI DATABASE AZURE MYSQL (VERSI TANPA SSL) =====
# ===== KONFIGURASI DATABASE AZURE MYSQL (TANPA SSL) =====
# ===== KONFIGURASI DATABASE AZURE MYSQL =====
DB_CONFIG = {
    'host': 'ajimex-design.mysql.database.azure.com', # <-- Pastikan ini benar
    'user': 'Sqladmin',
    'password': 'Admin_123',
    'database': 'designku_db',
    'port': 3306
}
# Kredensial Admin
ADMIN_CREDENTIALS = {
    "admin": "admin123",
    "superadmin": "super123"
}

# ===== FUNGSI DATABASE =====

def get_db_connection():
    """Membuat koneksi ke Azure MySQL"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def init_db():
    """Membuat tabel orders jika belum ada"""
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database!")
        return
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                whatsapp VARCHAR(20) NOT NULL,
                service VARCHAR(255) NOT NULL,
                deadline DATE NOT NULL,
                description TEXT,
                price INT NOT NULL,
                status VARCHAR(255) NOT NULL,
                date DATETIME NOT NULL,
                review TEXT
            )
        ''')
        conn.commit()
        print("✅ Database table 'orders' ready!")
    except Error as e:
        print(f"Error creating table: {e}")
    finally:
        cursor.close()
        conn.close()

# Jalankan inisialisasi saat aplikasi start
init_db()

# ===== ROUTE HALAMAN HTML =====

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin/login')
def admin_login_page():
    return render_template('login.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# ===== API ADMIN LOGIN =====

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    
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

# ===== API ORDERS =====

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Simpan order baru ke MySQL"""
    data = request.json
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        # === BAGIAN PERBAIKAN TANGGAL (FIX) ===
        # Mengubah format '2026-01-05T14:31:07.040Z' menjadi '2026-01-05 14:31:07'
        tanggal_raw = data.get('timestamp')
        if tanggal_raw and 'T' in tanggal_raw:
            tanggal_fix = tanggal_raw.replace('T', ' ').replace('Z', '').split('.')[0]
        else:
            tanggal_fix = tanggal_raw
        # ======================================

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO orders (id, name, whatsapp, service, deadline, description, price, status, date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            data['orderId'], 
            data['name'], 
            data['whatsapp'], 
            data['service'], 
            data['deadline'], 
            data['description'], 
            data['price'], 
            data['status'], 
            tanggal_fix  # <-- Pakai tanggal yang sudah dibersihkan
        ))
        conn.commit()
        return jsonify({"message": "Order sukses!", "id": data['orderId']}), 201
    except Error as e:
        print(f"Error inserting order: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Ambil semua orders dari MySQL"""
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM orders ORDER BY date DESC')
        orders = cursor.fetchall()
        
        # Konversi datetime ke string
        orders_list = []
        for row in orders:
            orders_list.append({
                "orderId": row['id'],
                "name": row['name'],
                "whatsapp": row['whatsapp'],
                "service": row['service'],
                "deadline": row['deadline'].strftime('%Y-%m-%d') if row['deadline'] else '',
                "description": row['description'],
                "price": row['price'],
                "status": row['status'],
                "timestamp": row['date'].strftime('%Y-%m-%dT%H:%M:%S') if row['date'] else '',
                "review": row['review']
            })
        
        return jsonify(orders_list), 200
    except Error as e:
        print(f"Error fetching orders: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/orders/update-status', methods=['POST'])
def update_status():
    """Update status order"""
    data = request.json
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('UPDATE orders SET status = %s WHERE id = %s', 
                      (data['status'], data['orderId']))
        conn.commit()
        return jsonify({"message": "Status updated"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/orders/delete', methods=['POST'])
def delete_order():
    """Hapus order"""
    data = request.json
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM orders WHERE id = %s', (data['orderId'],))
        conn.commit()
        return jsonify({"message": "Order deleted"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/orders/review', methods=['POST'])
def submit_review():
    """Submit review"""
    data = request.json
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('UPDATE orders SET review = %s WHERE id = %s', 
                      (data['review'], data['orderId']))
        conn.commit()
        return jsonify({"message": "Review submitted"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/orders/export-csv', methods=['GET'])
def export_csv():
    """Export orders ke CSV"""
    conn = get_db_connection()
    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM orders ORDER BY date DESC')
        orders = cursor.fetchall()
        
        output = StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Order ID', 'Nama', 'WhatsApp', 'Layanan', 'Deadline', 
                        'Deskripsi', 'Harga', 'Status', 'Tanggal Order', 'Review'])
        
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
        
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=pesanan_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'}
        )
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== TEST DATABASE CONNECTION =====

@app.route('/db-test')
def db_test():
    """Route untuk test koneksi database"""
    conn = get_db_connection()
    
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            cursor.close()
            conn.close()
            return f"✅ Database connected! MySQL version: {version[0]}"
        except Error as e:
            return f"❌ Database error: {str(e)}"
    else:
        return "❌ Failed to connect to database"

if __name__ == '__main__':
    app.run(debug=True)