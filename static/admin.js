// =================================================
// KONFIGURASI ADMIN
// =================================================

const ADMIN_PASSWORD = "admin123";

function checkAdminSession() {
    const isLogged = sessionStorage.getItem('adminLogged');
    if (!isLogged) {
        // Redirect ke halaman login
        window.location.href = "/admin/login";
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('adminLogged');
    sessionStorage.removeItem('adminUsername');
    window.location.href = "/admin/login";
}

// =================================================
// Utility Functions
// =================================================

function showNotification(msg, type) {
    console.log(`[${type}] ${msg}`);
}

const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (match) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[match]);
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

// =================================================
// LOGIC UTAMA (FETCH DARI PYTHON)
// =================================================

let allOrders = [];
let currentDetailId = null;
let currentSortOrder = 'desc'; // 'desc' = terbaru, 'asc' = terlama

async function loadDataFromPython() {
    try {
        console.log('Fetching orders from API...');
        const response = await fetch('/api/orders');
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        allOrders = data;
        applySorting();
        applyFilters();
        updateDashboardStats();
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        document.getElementById('orders-table-body').innerHTML = 
            `<tr><td colspan="6" class="p-4 text-center text-red-500">
                Gagal koneksi ke server database.<br>
                <span class="text-sm">Error: ${error.message}</span><br>
                <span class="text-xs text-gray-500">Pastikan Flask server sudah running di http://127.0.0.1:5000</span>
            </td></tr>`;
    }
}

function updateDashboardStats() {
    document.getElementById('total-orders').textContent = allOrders.length;
    
    const completed = allOrders.filter(o => o.status.includes('Selesai')).length;
    document.getElementById('completed-orders').textContent = completed;
    
    const pending = allOrders.filter(o => !o.status.includes('Selesai')).length;
    document.getElementById('pending-orders').textContent = pending;
    
    const revenue = allOrders
        .filter(o => o.status.includes('Selesai'))
        .reduce((sum, o) => sum + (o.price || 0), 0);
    document.getElementById('total-revenue').textContent = formatCurrency(revenue);
}

// =================================================
// FITUR BARU: SORTING (DENGAN DROPDOWN)
// =================================================

function applySorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        currentSortOrder = sortSelect.value; // 'desc' atau 'asc'
    }
    
    allOrders.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return currentSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
}

// =================================================
// FITUR BARU: FILTERING
// =================================================

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    let filtered = [...allOrders];
    
    // Filter berdasarkan pencarian
    if (searchTerm) {
        filtered = filtered.filter(o => 
            o.name.toLowerCase().includes(searchTerm) || 
            o.orderId.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter berdasarkan status
    if (statusFilter) {
        filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    renderOrders(filtered);
}

function renderOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">Tidak ada pesanan ditemukan.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="p-4 font-mono text-sm text-gray-600">${order.orderId}</td>
            <td class="p-4 font-medium">${escapeHTML(order.name)}</td>
            <td class="p-4 text-sm text-gray-600">${order.service}</td>
            <td class="p-4 text-sm text-gray-500">${formatDate(order.timestamp)}</td>
            <td class="p-4">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                <button onclick="openDetailModal('${order.orderId}')" class="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded" title="Detail">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
                <button onclick="openStatusModal('${order.orderId}')" class="text-yellow-600 hover:text-yellow-800 p-1 bg-yellow-50 rounded" title="Update Status">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button onclick="openDeleteModal('${order.orderId}')" class="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded" title="Hapus">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getStatusColor(status) {
    if (status.includes('Selesai')) return 'bg-green-100 text-green-800 border border-green-200';
    if (status.includes('Menunggu Pembayaran')) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (status.includes('Diproses') || status.includes('Dikerjakan')) return 'bg-blue-100 text-blue-800 border border-blue-200';
    return 'bg-gray-100 text-gray-800 border border-gray-200';
}

// =================================================
// FITUR BARU: EXPORT CSV
// =================================================

function exportToCSV() {
    window.location.href = '/api/orders/export-csv';
}

// =================================================
// MODAL HANDLERS
// =================================================

window.openDetailModal = function(id) {
    const order = allOrders.find(o => o.orderId === id);
    if (!order) return;

    document.getElementById('detail-id').textContent = order.orderId;
    document.getElementById('detail-name').textContent = order.name;
    document.getElementById('detail-whatsapp').innerHTML = `<a href="https://wa.me/${order.whatsapp}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1">${order.whatsapp} <i data-lucide="external-link" class="w-3 h-3"></i></a>`;
    document.getElementById('detail-service').textContent = order.service;
    document.getElementById('detail-deadline').textContent = order.deadline;
    document.getElementById('detail-desc').textContent = order.description;
    document.getElementById('detail-price').textContent = formatCurrency(order.price);
    document.getElementById('detail-status').textContent = order.status;
    document.getElementById('detail-date').textContent = formatDate(order.timestamp);

    const reviewBtn = document.getElementById('view-review-btn');
    if (order.review) {
        reviewBtn.classList.remove('hidden');
        reviewBtn.onclick = () => openReviewModal(order);
    } else {
        reviewBtn.classList.add('hidden');
    }

    toggleModal('admin-detail-modal', true);
    lucide.createIcons();
}

window.openStatusModal = function(id) {
    currentDetailId = id;
    const order = allOrders.find(o => o.orderId === id);
    const select = document.getElementById('new-status');
    select.value = order.status; 
    toggleModal('admin-status-modal', true);
}

window.openDeleteModal = function(id) {
    currentDetailId = id;
    toggleModal('admin-delete-confirm-modal', true);
}

window.openReviewModal = function(order) {
    document.getElementById('admin-review-order-id').textContent = order.orderId;
    document.getElementById('admin-review-name').textContent = order.name;
    document.getElementById('admin-review-text').textContent = order.review;
    toggleModal('admin-review-modal', true);
}

// =================================================
// ACTION HANDLERS (UPDATE & DELETE)
// =================================================

async function handleStatusUpdate(e) {
    e.preventDefault();
    const newStatus = document.getElementById('new-status').value;
    
    try {
        const response = await fetch('/api/orders/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: currentDetailId, status: newStatus })
        });

        if (response.ok) {
            toggleModal('admin-status-modal', false);
            loadDataFromPython();
        } else {
            alert('Gagal update status');
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleDeleteConfirm() {
    try {
        const response = await fetch('/api/orders/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: currentDetailId })
        });

        if (response.ok) {
            toggleModal('admin-delete-confirm-modal', false);
            loadDataFromPython();
        } else {
            alert('Gagal menghapus data');
        }
    } catch (error) {
        console.error(error);
    }
}

// =================================================
// INISIALISASI
// =================================================

document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession();
    
    // Tampilkan username admin (dengan pengecekan elemen)
    const usernameElement = document.getElementById('admin-username');
    const username = sessionStorage.getItem('adminUsername');
    if (usernameElement && username) {
        usernameElement.textContent = username;
    }
    
    loadDataFromPython();
    
    // Event Listeners
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const sortSelect = document.getElementById('sort-select');
    const exportBtn = document.getElementById('export-csv-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            console.log('Sort changed to:', sortSelect.value); // Debug
            applySorting();
            applyFilters();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportToCSV();
        });
    }
    
    document.getElementById('admin-status-form').addEventListener('submit', handleStatusUpdate);
    document.getElementById('admin-status-cancel').addEventListener('click', () => toggleModal('admin-status-modal', false));
    
    document.getElementById('admin-delete-confirm').addEventListener('click', handleDeleteConfirm);
    document.getElementById('admin-delete-cancel').addEventListener('click', () => toggleModal('admin-delete-confirm-modal', false));
    
    document.getElementById('admin-detail-close').addEventListener('click', () => toggleModal('admin-detail-modal', false));
    document.getElementById('admin-review-close').addEventListener('click', () => toggleModal('admin-review-modal', false));
});