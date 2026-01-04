// =============================================
// ===== KONFIGURASI DAN DATA =====
// =============================================

// Status awal pesanan
const INITIAL_STATUS = "Orderan Sudah Masuk..Menunggu Diproses Oleh Desainer";

// Data Harga
const PRICE_LIST = {
    "Desain Logo": 300000,
    "Desain UI/UX": 800000,
    "Desain Konten Sosmed": 500000,
    "Desain Banner/Spanduk": 150000,
    "Lainnya": 100000 // Harga default
};

// No. WhatsApp Admin
const ADMIN_WA_NUMBER = '6287734237040'; 

// Data Bank
const BANK_ACCOUNTS = [
    { bank: "Bank BCA", number: "1234-567-890", name: "PT Design Kreatif" },
    { bank: "Bank Mandiri", number: "9876-543-210", name: "PT Design Kreatif" },
    { bank: "Bank BNI", number: "1122-334-455", name: "PT Design Kreatif" }
];

// Status Pembayaran
const PAYMENT_TRIGGER_STATUSES = [
    "Menunggu Pembayaran",
    "Revisi Selesai..Menunggu Pelunasan"
];

// =================================================
// Utility Functions (Fungsi Bantuan)
// =================================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notification-text');
    
    notification.className = `fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-transform duration-300 ease-out transform ${
        type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
    }`;
    
    text.textContent = message;
    notification.classList.remove('translate-x-[150%]');
    
    setTimeout(() => {
        notification.classList.add('translate-x-[150%]');
    }, 3000);
}

function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    window.scrollTo(0, 0);
}

// =================================================
// Logic Halaman Order
// =================================================

// Update harga real-time
const serviceSelect = document.getElementById('service');
const otherServiceContainer = document.getElementById('other-service-container');
const priceDisplay = document.getElementById('price-display');

if (serviceSelect) {
    serviceSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        
        if (selected === 'Lainnya') {
            otherServiceContainer.classList.remove('hidden');
            document.getElementById('other-service').required = true;
        } else {
            otherServiceContainer.classList.add('hidden');
            document.getElementById('other-service').required = false;
        }

        const price = PRICE_LIST[selected] || 0;
        priceDisplay.textContent = formatCurrency(price);
    });
}

// --- FUNGSI SUBMIT ORDER (REVISI UTAMA) ---
async function handleOrderSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const serviceSelectVal = document.getElementById('service').value;
    const otherServiceVal = document.getElementById('other-service').value;
    const deadline = document.getElementById('deadline').value;
    const description = document.getElementById('description').value;

    const finalService = serviceSelectVal === 'Lainnya' ? otherServiceVal : serviceSelectVal;
    const price = PRICE_LIST[serviceSelectVal] || PRICE_LIST['Lainnya'];
    const orderId = generateOrderId();

    const newOrder = {
        orderId: orderId,
        name: name,
        whatsapp: whatsapp,
        service: finalService,
        deadline: deadline,
        description: description,
        price: price,
        status: INITIAL_STATUS,
        timestamp: new Date().toISOString(),
        review: null 
    };

    // KIRIM KE DATABASE PYTHON
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
        });

        if (response.ok) {
            e.target.reset();
            document.getElementById('other-service-container').classList.add('hidden');
            document.getElementById('price-display').textContent = formatCurrency(0);
            
            document.getElementById('order-success-id').textContent = orderId;
            toggleModal('order-success-modal', true);
        } else {
            showNotification('Gagal menyimpan pesanan ke server.', 'error');
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification('Terjadi kesalahan koneksi.', 'error');
    }
}

// =================================================
// Logic Halaman Lacak (Track)
// =================================================

async function handleTrackOrder(e) {
    e.preventDefault();
    const orderIdInput = document.getElementById('track-order-id').value.trim();

    if (!orderIdInput) {
        showNotification('Masukkan ID Pesanan!', 'error');
        return;
    }

    try {
        // AMBIL DATA DARI DATABASE PYTHON
        const response = await fetch('/api/orders');
        const orders = await response.json();
        
        // Cari order yang sesuai
        const order = orders.find(o => o.orderId === orderIdInput);

        if (order) {
            // Tampilkan Detail
            document.getElementById('track-result').classList.remove('hidden');
            
            document.getElementById('detail-order-id').textContent = order.orderId;
            document.getElementById('detail-status').textContent = order.status;
            document.getElementById('detail-status').className = `font-bold ${
                order.status.includes('Selesai') ? 'text-green-600' : 'text-blue-600'
            }`;
            
            document.getElementById('detail-name').textContent = order.name;
            document.getElementById('detail-service').textContent = order.service;
            document.getElementById('detail-deadline').textContent = new Date(order.deadline).toLocaleDateString('id-ID');
            document.getElementById('detail-price').textContent = formatCurrency(order.price);

            // Logika Tombol Bayar
            const paymentSection = document.getElementById('payment-section');
            if (PAYMENT_TRIGGER_STATUSES.includes(order.status)) {
                paymentSection.classList.remove('hidden');
                renderBankAccounts();
                setupWhatsAppButton(order);
            } else {
                paymentSection.classList.add('hidden');
            }

            // Logika Ulasan
            const reviewSection = document.getElementById('review-section');
            const existingReviewSection = document.getElementById('track-existing-review');
            
            if (order.status === 'Selesai - Pesanan Diterima') {
                if (order.review) {
                    reviewSection.classList.add('hidden');
                    existingReviewSection.classList.remove('hidden');
                    document.getElementById('existing-review-text').textContent = `"${order.review}"`;
                } else {
                    reviewSection.classList.remove('hidden');
                    existingReviewSection.classList.add('hidden');
                    // Simpan ID untuk form review
                    document.getElementById('review-form').dataset.orderId = order.orderId;
                }
            } else {
                reviewSection.classList.add('hidden');
                existingReviewSection.classList.add('hidden');
            }

        } else {
            showNotification('Order ID tidak ditemukan!', 'error');
            document.getElementById('track-result').classList.add('hidden');
        }

    } catch (error) {
        console.error("Error:", error);
        showNotification('Gagal mengambil data dari server.', 'error');
    }
}

function renderBankAccounts() {
    const container = document.getElementById('bank-accounts-list');
    container.innerHTML = BANK_ACCOUNTS.map(acc => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded border">
            <div>
                <p class="font-bold text-gray-800">${acc.bank}</p>
                <p class="text-sm text-gray-600">${acc.name}</p>
            </div>
            <div class="text-right">
                <p class="font-mono text-lg font-semibold select-all">${acc.number}</p>
                <button onclick="navigator.clipboard.writeText('${acc.number}').then(() => showNotification('No Rekening Disalin'))" 
                        class="text-xs text-blue-600 hover:underline">
                    Salin
                </button>
            </div>
        </div>
    `).join('');
}

function setupWhatsAppButton(order) {
    const btn = document.getElementById('confirm-payment-btn');
    btn.onclick = () => {
        const message = `Halo Admin, saya sudah melakukan pembayaran untuk Order ID: ${order.orderId} (${order.service}). Mohon dicek. Terima kasih.`;
        const url = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };
}

// --- FUNGSI REVIEW (REVISI) ---
async function handleReviewSubmit(e) {
    e.preventDefault();
    const reviewText = document.getElementById('review-text').value;
    const orderId = e.target.dataset.orderId;

    if (!reviewText || !orderId) return;

    try {
        const response = await fetch('/api/orders/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderId, review: reviewText })
        });

        if (response.ok) {
            showNotification('Terima kasih atas ulasan Anda!', 'success');
            document.getElementById('review-section').classList.add('hidden');
            document.getElementById('existing-review-text').textContent = `"${reviewText}"`;
            document.getElementById('track-existing-review').classList.remove('hidden');
        } else {
            showNotification('Gagal mengirim ulasan.', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
    }
}


// =================================================
// Event Listeners (User)
// =================================================

document.addEventListener('DOMContentLoaded', () => {
    // Form Submit: Order
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);

    // Form Submit: Track
    const trackForm = document.getElementById('track-order-form');
    if (trackForm) trackForm.addEventListener('submit', handleTrackOrder);
    
    // Form Submit: Review
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);

    // Modal: Order Success
    const successCloseBtn = document.getElementById('order-success-close');
    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', () => {
            toggleModal('order-success-modal', false);
            const orderId = document.getElementById('order-success-id').textContent;
            
            // Pindah ke halaman track
            document.getElementById('track-order-id').value = orderId;
            showPage('page-track');
            
            // Otomatis cari
            handleTrackOrder({ preventDefault: () => {} }); 
        });
    }
    
    // Inisialisasi Icon Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});