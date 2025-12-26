// Data Storage
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editingProductId = null;
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
let isAdmin = localStorage.getItem('isAdmin') === 'true';
const PAYMENT_FEES = {
    cash: 0,
    qris: 0.01,
    ewallet: 0.015,
    card: 0.02
};
let lastReceipt = null;
const LAST_UPDATE_KEY = 'lastUpdate';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCart();
    loadHistory();
    updateCartDisplay();
    registerServiceWorker();
    updateAuthUI();
});

// Section Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// ============ PRODUK MANAGEMENT ============

function loadProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';

    if (products.length === 0) {
        productsList.innerHTML = '<p class="empty-message">Belum ada produk. Tambahkan produk pertama Anda!</p>';
        renderCatalog();
        return;
    }

    products.forEach(product => {
        const disabledAttr = isAdmin ? '' : 'disabled';
        const disabledClass = isAdmin ? '' : 'disabled-action';
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card-header">
                <div class="product-name">${product.name}</div>
                <div class="product-actions">
                    <button class="product-action-btn edit-btn ${disabledClass}" ${disabledAttr} onclick="openEditModal(${product.id})" title="Edit">✏️</button>
                    <button class="product-action-btn delete-btn ${disabledClass}" ${disabledAttr} onclick="deleteProduct(${product.id})" title="Hapus">🗑️</button>
                </div>
            </div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-stock">Stok: ${product.stock}</div>
            ${product.barcode ? `<div class="product-barcode">Barcode: ${product.barcode}</div>` : ''}
        `;
        productsList.appendChild(productCard);
    });

    renderCatalog();
}

function renderCatalog() {
    const catalogList = document.getElementById('catalogList');
    updateCatalogMeta();
    if (!catalogList) return;

    if (products.length === 0) {
        catalogList.innerHTML = '<p class="empty-message">Belum ada produk tersedia.</p>';
        return;
    }

    catalogList.innerHTML = products.map(product => {
        let stockClass = 'catalog-stock';
        let stockLabel = `Stok: ${product.stock}`;
        if (product.stock === 0) {
            stockClass += ' out';
            stockLabel = 'Stok habis';
        } else if (product.stock <= 5) {
            stockClass += ' low';
            stockLabel += ' (menipis)';
        }

        return `
            <div class="catalog-card">
                <h4>${product.name}</h4>
                <div class="catalog-price">${formatCurrency(product.price)}</div>
                <div class="${stockClass}">${stockLabel}</div>
                ${product.barcode ? `<div class="product-barcode">Barcode: ${product.barcode}</div>` : ''}
            </div>
        `;
    }).join('');
}

function addProduct() {
    if (!requireAdmin()) return;

    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const barcode = document.getElementById('productBarcode').value.trim();

    if (!name || !price || price < 0 || stock < 0) {
        alert('Mohon isi semua field dengan benar!');
        return;
    }

    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        stock: stock,
        barcode: barcode || null
    };

    products.push(newProduct);
    saveProducts();
    loadProducts();

    // Reset form
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productBarcode').value = '';

    showNotification('Produk berhasil ditambahkan!', 'success');
}

function openEditModal(productId) {
    if (!requireAdmin()) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductBarcode').value = product.barcode || '';

    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingProductId = null;
}

function saveProductEdit() {
    if (!requireAdmin()) return;
    if (!editingProductId) return;

    const name = document.getElementById('editProductName').value.trim();
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const stock = parseInt(document.getElementById('editProductStock').value);
    const barcode = document.getElementById('editProductBarcode').value.trim();

    if (!name || !price || price < 0 || stock < 0) {
        alert('Mohon isi semua field dengan benar!');
        return;
    }

    const productIndex = products.findIndex(p => p.id === editingProductId);
    if (productIndex !== -1) {
        products[productIndex] = {
            ...products[productIndex],
            name: name,
            price: price,
            stock: stock,
            barcode: barcode || null
        };
        saveProducts();
        loadProducts();
        closeEditModal();
        showNotification('Produk berhasil diperbarui!', 'success');
    }
}

function deleteProduct(productId) {
    if (!requireAdmin()) return;
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        return;
    }

    products = products.filter(p => p.id !== productId);
    saveProducts();
    loadProducts();
    showNotification('Produk berhasil dihapus!', 'success');
}

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
    updateCatalogMeta();
}

// ============ KASIR / CART ============

function addProductToCart() {
    const searchInput = document.getElementById('productSearch').value.trim();
    if (!searchInput) {
        alert('Mohon masukkan nama produk atau barcode!');
        return;
    }

    const product = products.find(p => 
        p.name.toLowerCase().includes(searchInput.toLowerCase()) || 
        (p.barcode && p.barcode === searchInput)
    );

    if (!product) {
        alert('Produk tidak ditemukan!');
        return;
    }

    if (product.stock === 0) {
        alert('Stok produk habis!');
        return;
    }

    const existingCartItem = cart.find(item => item.productId === product.id);
    
    if (existingCartItem) {
        if (existingCartItem.quantity >= product.stock) {
            alert('Stok tidak mencukupi!');
            return;
        }
        existingCartItem.quantity++;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    updateCartDisplay();
    document.getElementById('productSearch').value = '';
    document.getElementById('productSearch').focus();
}

function handleSearchEnter(event) {
    if (event.key === 'Enter') {
        addProductToCart();
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-message">Keranjang kosong</p>';
        updateCartSummary();
        return;
    }

    cart.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId);
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">${formatCurrency(item.price)} × ${item.quantity}</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
                </div>
                <div class="cart-item-price">${formatCurrency(item.price * item.quantity)}</div>
                <button class="remove-btn" onclick="removeFromCart(${index})">Hapus</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    updateCartSummary();
}

function increaseQuantity(index) {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    
    if (item.quantity >= product.stock) {
        alert('Stok tidak mencukupi!');
        return;
    }
    
    item.quantity++;
    saveCart();
    updateCartDisplay();
}

function decreaseQuantity(index) {
    const item = cart[index];
    if (item.quantity > 1) {
        item.quantity--;
        saveCart();
        updateCartDisplay();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (!confirm('Apakah Anda yakin ingin menghapus semua item dari keranjang?')) {
        return;
    }
    
    cart = [];
    saveCart();
    updateCartDisplay();
    document.getElementById('paymentAmount').value = '';
    updateChange();
}

function updateCartSummary() {
    const totals = calculateTotals();

    document.getElementById('subtotal').textContent = formatCurrency(totals.subtotal);
    document.getElementById('totalItems').textContent = totals.totalItems;
    document.getElementById('total').textContent = formatCurrency(totals.subtotal);
    document.getElementById('paymentFee').textContent = formatCurrency(totals.fee);
    document.getElementById('grandTotal').textContent = formatCurrency(totals.grandTotal);

    updatePaymentInputState(totals);
    updateChange();
}

function updateChange() {
    const totals = calculateTotals();
    const method = document.getElementById('paymentMethod').value;
    const paymentField = document.getElementById('paymentAmount');
    const payment = method === 'cash'
        ? (parseFloat(paymentField.value) || 0)
        : totals.grandTotal;

    const change = payment - totals.grandTotal;

    document.getElementById('change').textContent = formatCurrency(Math.max(0, change));
    
    if (change < 0) {
        document.getElementById('change').style.color = '#f44336';
    } else {
        document.getElementById('change').style.color = '#2e7d32';
    }
}

function handlePaymentEnter(event) {
    if (event.key === 'Enter') {
        processPayment();
    } else {
        updateChange();
    }
}

document.getElementById('paymentAmount').addEventListener('input', updateChange);

function processPayment() {
    if (cart.length === 0) {
        alert('Keranjang kosong!');
        return;
    }

    const totals = calculateTotals();
    const method = document.getElementById('paymentMethod').value;
    const payment = parseFloat(document.getElementById('paymentAmount').value) || 0;
    const effectivePayment = method === 'cash' ? payment : totals.grandTotal;
    const payable = totals.grandTotal;

    if (effectivePayment < payable) {
        alert('Jumlah pembayaran kurang!');
        return;
    }

    // Check stock availability
    for (let item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product.stock < item.quantity) {
            alert(`Stok ${product.name} tidak mencukupi!`);
            return;
        }
    }

    // Update stock
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        product.stock -= item.quantity;
    });

    // Create transaction
    const transaction = {
        id: Date.now(),
        date: new Date().toLocaleString('id-ID'),
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        })),
        total: totals.subtotal,
        fee: totals.fee,
        grandTotal: totals.grandTotal,
        payment: effectivePayment,
        change: effectivePayment - payable,
        method
    };

    transactions.unshift(transaction);
    saveTransactions();
    saveProducts();

    showNotification(`Transaksi berhasil! Kembalian: ${formatCurrency(effectivePayment - payable)}`, 'success');

    // Clear cart
    cart = [];
    saveCart();
    updateCartDisplay();
    document.getElementById('paymentAmount').value = '';
    updateChange();

    // Reload history if on history page
    if (document.getElementById('history').classList.contains('active')) {
        loadHistory();
    }

    // Simpan struk terakhir
    generateReceipt(transaction);
    document.getElementById('receiptPreviewBtn').style.display = 'inline-flex';
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// ============ RIWAYAT TRANSAKSI ============

function loadHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    // Update stats
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.grandTotal || t.total), 0);
    const exportBtn = document.getElementById('exportCsvBtn');
    const topProductLabel = document.getElementById('topProduct');
    
    document.getElementById('totalTransactions').textContent = totalTransactions;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    if (exportBtn) {
        exportBtn.disabled = transactions.length === 0;
    }
    if (topProductLabel) {
        const top = getTopProduct();
        topProductLabel.textContent = top ? `${top.name} (${top.qty}x)` : '-';
    }
    renderInsights();

    if (transactions.length === 0) {
        historyList.innerHTML = '<p class="empty-message">Belum ada transaksi</p>';
        return;
    }

    transactions.forEach(transaction => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-header">
                <div class="history-date">${transaction.date}</div>
                <div class="history-total">${formatCurrency(transaction.grandTotal || transaction.total)}</div>
            </div>
            <div class="history-items">
                ${transaction.items.map(item => `
                    <div class="history-item-row">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>${formatCurrency(item.subtotal)}</span>
                    </div>
                `).join('')}
                <div class="history-item-row" style="color: #777;">
                    <span>Metode:</span>
                    <span>${formatPaymentMethod(transaction.method)}</span>
                </div>
                ${transaction.fee ? `
                <div class="history-item-row" style="color: #777;">
                    <span>Biaya Pembayaran:</span>
                    <span>${formatCurrency(transaction.fee)}</span>
                </div>
                ` : ''}
                <div class="history-item-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-weight: 600;">
                    <span>Bayar:</span>
                    <span>${formatCurrency(transaction.payment)}</span>
                </div>
                <div class="history-item-row" style="color: #2e7d32; font-weight: 600;">
                    <span>Kembalian:</span>
                    <span>${formatCurrency(transaction.change)}</span>
                </div>
            </div>
        `;
        historyList.appendChild(historyItem);
    });

    renderSalesChart();
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateCatalogMeta();
}

// ============ UTILITY ============

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatPaymentMethod(method) {
    if (!method) return 'Cash';
    const labels = {
        cash: 'Cash',
        qris: 'QRIS',
        ewallet: 'E-Wallet',
        card: 'Kartu'
    };
    return labels[method] || method;
}

function getTopProduct() {
    const counter = {};
    transactions.forEach(t => {
        t.items.forEach(i => {
            counter[i.name] = (counter[i.name] || 0) + i.quantity;
        });
    });
    const entries = Object.entries(counter);
    if (!entries.length) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], qty: entries[0][1] };
}

function renderSalesChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Group by date (DD/MM/YYYY)
    const map = {};
    transactions.forEach(t => {
        const date = t.date.split(',')[0].trim();
        map[date] = (map[date] || 0) + (t.grandTotal || t.total);
    });
    const entries = Object.entries(map).sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')));
    const recent = entries.slice(-7);
    const labels = recent.map(e => e[0]);
    const values = recent.map(e => e[1]);

    if (!values.length) {
        ctx.fillStyle = '#999';
        ctx.fillText('Belum ada data', 20, 40);
        return;
    }

    const maxVal = Math.max(...values) || 1;
    const padding = 30;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;
    const barWidth = w / values.length - 10;

    ctx.fillStyle = '#667eea';
    values.forEach((v, idx) => {
        const x = padding + idx * (barWidth + 10);
        const barH = (v / maxVal) * h;
        const y = canvas.height - padding - barH;
        ctx.fillRect(x, y, barWidth, barH);
        ctx.fillStyle = '#444';
        ctx.font = '12px sans-serif';
        ctx.fillText(labels[idx], x, canvas.height - padding + 14);
        ctx.fillStyle = '#667eea';
    });

    ctx.fillStyle = '#444';
    ctx.font = '12px sans-serif';
    ctx.fillText('Rp', padding, padding - 6);
}

// ============ INSIGHTS (AI SEDERHANA) ============

function renderInsights() {
    renderRestockRecommendations();
    renderBundles();
    renderAnomalies();
    renderForecast();
    renderTrends();
    renderDiscounts();
    renderProfitability();
    renderStockout();
}

function renderRestockRecommendations() {
    const list = document.getElementById('restockList');
    if (!list) return;
    const recs = getRestockRecommendations();
    if (!recs.length) {
        list.innerHTML = '<li class="empty">Belum ada rekomendasi</li>';
        return;
    }
    list.innerHTML = recs.map(r => `<li>${r.name}: stok ${r.stock}, laju ${r.rate}/hari → saran restock ${r.suggest}</li>`).join('');
}

function renderBundles() {
    const list = document.getElementById('bundleList');
    if (!list) return;
    const pairs = getBundlePairs();
    if (!pairs.length) {
        list.innerHTML = '<li class="empty">Belum ada data</li>';
        return;
    }
    list.innerHTML = pairs.map(p => `<li>${p.items.join(' + ')} (${p.count}x)</li>`).join('');
}

function renderAnomalies() {
    const list = document.getElementById('anomalyList');
    if (!list) return;
    const anomalies = detectAnomalies();
    if (!anomalies.length) {
        list.innerHTML = '<li class="empty">Tidak ada anomali</li>';
        return;
    }
    list.innerHTML = anomalies.map(a => `<li>${a.reason} — ${a.label}</li>`).join('');
}

function getRestockRecommendations() {
    if (!transactions.length || !products.length) return [];
    const salesMap = {};
    transactions.forEach(t => {
        t.items.forEach(i => {
            salesMap[i.name] = (salesMap[i.name] || 0) + i.quantity;
        });
    });
    // estimasi hari data: min 7, max 30 jika ingin konservatif
    const days = Math.min(30, Math.max(7, transactions.length));
    const recs = products.map(p => {
        const sold = salesMap[p.name] || 0;
        const rate = +(sold / days).toFixed(2);
        const suggest = Math.max(0, Math.ceil(rate * 7) - p.stock); // target stok 7 hari
        return { name: p.name, rate, stock: p.stock, suggest };
    }).filter(r => r.suggest > 0 && r.rate > 0);
    recs.sort((a, b) => b.rate - a.rate);
    return recs.slice(0, 5);
}

function getBundlePairs() {
    if (!transactions.length) return [];
    const pairCount = {};
    transactions.forEach(t => {
        const names = t.items.map(i => i.name);
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const a = names[i];
                const b = names[j];
                const key = [a, b].sort().join(' | ');
                pairCount[key] = (pairCount[key] || 0) + 1;
            }
        }
    });
    const pairs = Object.entries(pairCount)
        .filter(([, c]) => c >= 2) // muncul minimal 2 kali
        .map(([k, c]) => ({ items: k.split(' | '), count: c }));
    pairs.sort((a, b) => b.count - a.count);
    return pairs.slice(0, 5);
}

function detectAnomalies() {
    if (!transactions.length) return [];
    const totals = transactions.map(t => t.grandTotal || t.total);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const std = Math.sqrt(totals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / totals.length);
    const highThreshold = avg + 2 * std;
    const anomalies = [];

    transactions.forEach((t, idx) => {
        const total = t.grandTotal || t.total;
        if (totals.length > 3 && total > highThreshold) {
            anomalies.push({ label: `Transaksi ${idx + 1}`, reason: `Nilai tinggi: ${formatCurrency(total)}` });
        }
        const bigQty = t.items.find(i => i.quantity >= 10);
        if (bigQty) {
            anomalies.push({ label: `Transaksi ${idx + 1}`, reason: `Qty besar: ${bigQty.name} x${bigQty.quantity}` });
        }
    });

    return anomalies.slice(0, 5);
}

// ============ PREDIKSI PENJUALAN ============

function renderForecast() {
    const list = document.getElementById('forecastList');
    if (!list) return;
    const forecasts = getSalesForecast();
    if (!forecasts.length) {
        list.innerHTML = '<li class="empty">Belum ada prediksi</li>';
        return;
    }
    list.innerHTML = forecasts.map(f => `<li>${f.period}: ${formatCurrency(f.predicted)} (±${formatCurrency(f.range)})</li>`).join('');
}

function getSalesForecast() {
    if (!transactions.length) return [];
    const dailySales = {};
    transactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString('id-ID');
        dailySales[date] = (dailySales[date] || 0) + (t.grandTotal || t.total);
    });
    const values = Object.values(dailySales);
    if (values.length < 3) return [];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const recent = values.slice(-7);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const trend = recentAvg > avg ? 1.1 : 0.9;
    const tomorrow = Math.round(recentAvg * trend);
    const week = Math.round(recentAvg * trend * 7);
    const variance = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);
    return [
        { period: 'Besok', predicted: tomorrow, range: Math.round(variance * 0.5) },
        { period: '7 hari', predicted: week, range: Math.round(variance * 1.5) }
    ];
}

// ============ ANALISIS TREN WAKTU ============

function renderTrends() {
    const list = document.getElementById('trendList');
    if (!list) return;
    const trends = getTimeTrends();
    if (!trends.length) {
        list.innerHTML = '<li class="empty">Belum ada analisis</li>';
        return;
    }
    list.innerHTML = trends.map(t => `<li>${t.label}: ${t.value}</li>`).join('');
}

function getTimeTrends() {
    if (!transactions.length) return [];
    const hourSales = {};
    const daySales = {};
    transactions.forEach(t => {
        const d = new Date(t.date);
        const hour = d.getHours();
        const day = d.getDay();
        hourSales[hour] = (hourSales[hour] || 0) + (t.grandTotal || t.total);
        daySales[day] = (daySales[day] || 0) + (t.grandTotal || t.total);
    });
    const topHour = Object.entries(hourSales).sort((a, b) => b[1] - a[1])[0];
    const topDay = Object.entries(daySales).sort((a, b) => b[1] - a[1])[0];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return [
        { label: 'Jam ramai', value: `${topHour[0]}:00 (${formatCurrency(topHour[1])})` },
        { label: 'Hari ramai', value: `${dayNames[topDay[0]]} (${formatCurrency(topDay[1])})` }
    ];
}

// ============ REKOMENDASI DISKON ============

function renderDiscounts() {
    const list = document.getElementById('discountList');
    if (!list) return;
    const discounts = getDiscountRecommendations();
    if (!discounts.length) {
        list.innerHTML = '<li class="empty">Belum ada rekomendasi</li>';
        return;
    }
    list.innerHTML = discounts.map(d => `<li>${d.name}: diskon ${d.discount}% (stok ${d.stock}, laju ${d.rate}/hari)</li>`).join('');
}

function getDiscountRecommendations() {
    if (!transactions.length || !products.length) return [];
    const salesMap = {};
    transactions.forEach(t => {
        t.items.forEach(i => {
            salesMap[i.name] = (salesMap[i.name] || 0) + i.quantity;
        });
    });
    const days = Math.min(30, Math.max(7, transactions.length));
    const slowProducts = products.map(p => {
        const sold = salesMap[p.name] || 0;
        const rate = +(sold / days).toFixed(2);
        const stockDays = p.stock > 0 ? Math.ceil(p.stock / (rate || 0.1)) : 999;
        return { name: p.name, stock: p.stock, rate, stockDays, price: p.price };
    }).filter(p => p.stock > 0 && (p.rate < 0.5 || p.stockDays > 60));
    slowProducts.sort((a, b) => b.stockDays - a.stockDays);
    return slowProducts.slice(0, 5).map(p => ({
        name: p.name,
        discount: p.stockDays > 90 ? 20 : p.stockDays > 60 ? 15 : 10,
        stock: p.stock,
        rate: p.rate
    }));
}

// ============ ANALISIS PROFITABILITAS ============

function renderProfitability() {
    const list = document.getElementById('profitabilityList');
    if (!list) return;
    const profits = getProfitabilityAnalysis();
    if (!profits.length) {
        list.innerHTML = '<li class="empty">Belum ada analisis</li>';
        return;
    }
    list.innerHTML = profits.map(p => `<li>${p.name}: ${formatCurrency(p.revenue)} (${p.count}x terjual)</li>`).join('');
}

function getProfitabilityAnalysis() {
    if (!transactions.length || !products.length) return [];
    const productSales = {};
    transactions.forEach(t => {
        t.items.forEach(i => {
            if (!productSales[i.name]) {
                productSales[i.name] = { revenue: 0, count: 0 };
            }
            productSales[i.name].revenue += i.subtotal;
            productSales[i.name].count += i.quantity;
        });
    });
    const analysis = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
    return analysis.slice(0, 5);
}

// ============ PREDIKSI STOK HABIS ============

function renderStockout() {
    const list = document.getElementById('stockoutList');
    if (!list) return;
    const predictions = getStockoutPredictions();
    if (!predictions.length) {
        list.innerHTML = '<li class="empty">Belum ada prediksi</li>';
        return;
    }
    list.innerHTML = predictions.map(p => `<li>${p.name}: habis dalam ${p.days} hari (stok ${p.stock}, laju ${p.rate}/hari)</li>`).join('');
}

function getStockoutPredictions() {
    if (!transactions.length || !products.length) return [];
    const salesMap = {};
    transactions.forEach(t => {
        t.items.forEach(i => {
            salesMap[i.name] = (salesMap[i.name] || 0) + i.quantity;
        });
    });
    const days = Math.min(30, Math.max(7, transactions.length));
    const predictions = products
        .filter(p => p.stock > 0)
        .map(p => {
            const sold = salesMap[p.name] || 0;
            const rate = +(sold / days).toFixed(2);
            const daysLeft = rate > 0 ? Math.ceil(p.stock / rate) : 999;
            return { name: p.name, stock: p.stock, rate, days: daysLeft };
        })
        .filter(p => p.days < 30 && p.rate > 0)
        .sort((a, b) => a.days - b.days);
    return predictions.slice(0, 5);
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const method = document.getElementById('paymentMethod') ? document.getElementById('paymentMethod').value : 'cash';
    const feeRate = PAYMENT_FEES[method] || 0;
    const fee = Math.round(subtotal * feeRate);
    const grandTotal = subtotal + fee;
    return { subtotal, totalItems, fee, grandTotal };
}

function handlePaymentMethodChange() {
    updateCartSummary();
}

function updatePaymentInputState(totals) {
    const method = document.getElementById('paymentMethod').value;
    const paymentField = document.getElementById('paymentAmount');
    const hint = document.getElementById('paymentHint');

    if (method === 'cash') {
        paymentField.disabled = false;
        hint.textContent = '(cash: isi manual, non-cash otomatis)';
    } else {
        paymentField.disabled = true;
        paymentField.value = totals.grandTotal;
        hint.textContent = '(non-cash: otomatis sesuai grand total)';
    }
}

// ============ SERVICE WORKER ============

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            // diam-kan jika gagal; bisa terjadi di file://
        });
    }
}

// ============ AUTH ADMIN ============

// ============ STRUK ============

function generateReceipt(transaction) {
    lastReceipt = transaction;
    const lines = [];
    lines.push('KASIR TOKO KELONTONG');
    lines.push(new Date(transaction.date).toLocaleString('id-ID'));
    lines.push('--------------------------------');
    transaction.items.forEach(item => {
        lines.push(`${item.name}`);
        lines.push(`  ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`);
    });
    lines.push('--------------------------------');
    lines.push(`Subtotal : ${formatCurrency(transaction.total)}`);
    if (transaction.fee) {
        lines.push(`Fee (${formatPaymentMethod(transaction.method)}): ${formatCurrency(transaction.fee)}`);
    }
    lines.push(`Grand Total : ${formatCurrency(transaction.grandTotal || transaction.total)}`);
    lines.push(`Bayar : ${formatCurrency(transaction.payment)}`);
    lines.push(`Kembalian : ${formatCurrency(transaction.change)}`);
    lines.push(`Metode : ${formatPaymentMethod(transaction.method)}`);
    lines.push('--------------------------------');
    lines.push('Terima kasih!');

    const receiptOutput = document.getElementById('receiptOutput');
    if (receiptOutput) {
        receiptOutput.textContent = lines.join('\n');
    }
}

function openReceiptModal() {
    if (!lastReceipt) {
        alert('Belum ada struk. Selesaikan transaksi terlebih dahulu.');
        return;
    }
    document.getElementById('receiptOutput').textContent = buildReceiptText(lastReceipt);
    document.getElementById('receiptModal').style.display = 'block';
}

function closeReceiptModal() {
    document.getElementById('receiptModal').style.display = 'none';
}

function buildReceiptText(transaction) {
    const lines = [];
    lines.push('KASIR TOKO KELONTONG');
    lines.push(transaction.date);
    lines.push('--------------------------------');
    transaction.items.forEach(item => {
        lines.push(`${item.name}`);
        lines.push(`  ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`);
    });
    lines.push('--------------------------------');
    lines.push(`Subtotal : ${formatCurrency(transaction.total)}`);
    if (transaction.fee) {
        lines.push(`Fee (${formatPaymentMethod(transaction.method)}): ${formatCurrency(transaction.fee)}`);
    }
    lines.push(`Grand Total : ${formatCurrency(transaction.grandTotal || transaction.total)}`);
    lines.push(`Bayar : ${formatCurrency(transaction.payment)}`);
    lines.push(`Kembalian : ${formatCurrency(transaction.change)}`);
    lines.push(`Metode : ${formatPaymentMethod(transaction.method)}`);
    lines.push('--------------------------------');
    lines.push('Terima kasih!');
    return lines.join('\n');
}

function copyReceipt() {
    if (!lastReceipt) return;
    const text = buildReceiptText(lastReceipt);
    navigator.clipboard.writeText(text).then(() => {
        alert('Struk disalin ke clipboard.');
    }).catch(() => {
        alert('Gagal menyalin struk.');
    });
}

function printReceipt() {
    if (!lastReceipt) return;
    const text = buildReceiptText(lastReceipt);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre>${text}</pre>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
}

function shareReceiptWhatsApp() {
    if (!lastReceipt) return;
    const text = encodeURIComponent(buildReceiptText(lastReceipt));
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
}

function copyReceiptEmail() {
    if (!lastReceipt) return;
    const text = buildReceiptText(lastReceipt);
    const subject = encodeURIComponent('Struk Transaksi');
    const body = encodeURIComponent(text);
    navigator.clipboard.writeText(`Subject: Struk Transaksi\n\n${text}`).catch(() => {});
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
}

// ============ EKSPOR CSV ============

function exportCSV() {
    if (!transactions.length) {
        alert('Belum ada transaksi untuk diekspor.');
        return;
    }

    const headers = ['Tanggal', 'Metode', 'Subtotal', 'Fee', 'Grand Total', 'Bayar', 'Kembalian', 'Item'];
    const rows = transactions.map(t => {
        const items = t.items.map(i => `${i.name} x${i.quantity} (${i.price})`).join(' | ');
        return [
            `"${t.date}"`,
            `"${formatPaymentMethod(t.method)}"`,
            t.total,
            t.fee || 0,
            t.grandTotal || t.total,
            t.payment,
            t.change,
            `"${items}"`
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transaksi-kasir-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Riwayat transaksi berhasil diekspor ke CSV.', 'success');
}

// ============ PRODUK CSV ============

function exportProductsCSV() {
    if (!products.length) {
        alert('Belum ada produk untuk diekspor.');
        return;
    }
    const headers = ['Nama', 'Harga', 'Stok', 'Barcode'];
    const rows = products.map(p => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.price,
        p.stock,
        `"${(p.barcode || '').replace(/"/g, '""')}"`
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `produk-kasir-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Produk berhasil diekspor ke CSV.', 'success');
}

function importProductsCSV(event) {
    if (!requireAdmin()) {
        event.target.value = '';
        return;
    }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length <= 1) {
            alert('File CSV kosong atau tidak valid.');
            return;
        }
        const imported = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 3) continue;
            const [name, priceStr, stockStr, barcode = ''] = cols;
            const price = parseFloat(priceStr);
            const stock = parseInt(stockStr);
            if (!name || isNaN(price) || isNaN(stock)) continue;
            imported.push({
                id: Date.now() + i,
                name: name.trim(),
                price,
                stock,
                barcode: barcode.trim() || null
            });
        }
        if (!imported.length) {
            alert('Tidak ada baris valid yang diimpor.');
            return;
        }
        products = products.concat(imported);
        saveProducts();
        loadProducts();
        showNotification(`Berhasil impor ${imported.length} produk.`, 'success');
    };
    reader.readAsText(file);
    event.target.value = '';
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && line[i + 1] === '"') {
            current += '"';
            i++;
        } else if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

// ============ BACKUP / RESTORE / RESET ============

function backupData() {
    if (!requireAdmin()) return;
    const payload = {
        exportedAt: new Date().toISOString(),
        products,
        transactions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-kasir-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Backup JSON berhasil diunduh.', 'success');
}

function restoreData(event) {
    if (!requireAdmin()) {
        event.target.value = '';
        return;
    }
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data.products) || !Array.isArray(data.transactions)) {
                alert('Format backup tidak valid.');
                return;
            }
            if (!confirm('Mengganti data saat ini dengan data backup?')) {
                return;
            }
            products = data.products.map((p, idx) => ({
                id: p.id || Date.now() + idx,
                name: p.name || 'Produk Tanpa Nama',
                price: Number(p.price) || 0,
                stock: Number(p.stock) || 0,
                barcode: p.barcode || null
            }));
            transactions = data.transactions;
            cart = [];
            saveProducts();
            saveTransactions();
            saveCart();
            loadProducts();
            loadHistory();
            updateCartDisplay();
            showNotification('Data berhasil direstore dari backup.', 'success');
        } catch (err) {
            alert('Gagal membaca file backup.');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (!requireAdmin()) return;
    if (!confirm('Semua data (produk, transaksi, keranjang) akan dihapus. Lanjutkan?')) {
        return;
    }
    products = [];
    transactions = [];
    cart = [];
    localStorage.removeItem('products');
    localStorage.removeItem('transactions');
    localStorage.removeItem('cart');
    localStorage.removeItem(LAST_UPDATE_KEY);
    saveCart();
    saveProducts();
    saveTransactions();
    loadProducts();
    loadHistory();
    updateCartDisplay();
    showNotification('Seluruh data berhasil direset.', 'warning');
}

// ============ META & NOTIFICATION ============

function updateCatalogMeta() {
    const lastLabel = document.getElementById('lastUpdateLabel');
    const storageLabel = document.getElementById('storageStatusLabel');
    if (lastLabel) {
        const last = localStorage.getItem(LAST_UPDATE_KEY);
        lastLabel.textContent = last ? `Terakhir diperbarui: ${new Date(last).toLocaleString('id-ID')}` : 'Terakhir diperbarui: -';
    }
    if (storageLabel) {
        storageLabel.textContent = `Produk ${products.length} | Transaksi ${transactions.length}`;
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        alert(message);
        return;
    }
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 3200);
}

function updateAuthUI() {
    const statusText = document.getElementById('adminStatusText');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const addProductBtn = document.getElementById('addProductBtn');
    const productFormCard = document.getElementById('productFormCard');
    const adminHint = document.getElementById('adminHint');
    const importInput = document.getElementById('importProductsInput');
    const exportBtn = document.getElementById('exportProductsBtn');
    const backupBtn = document.getElementById('backupBtn');
    const restoreLabel = document.getElementById('restoreLabel');
    const restoreInput = document.getElementById('restoreInput');
    const resetDataBtn = document.getElementById('resetDataBtn');

    statusText.textContent = isAdmin ? 'Admin' : 'Guest';
    loginButton.style.display = isAdmin ? 'none' : 'inline-flex';
    logoutButton.style.display = isAdmin ? 'inline-flex' : 'none';

    if (isAdmin) {
        addProductBtn.disabled = false;
        productFormCard.classList.remove('locked');
        adminHint.textContent = 'Anda masuk sebagai admin. Silakan kelola produk.';
        if (importInput) importInput.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
        if (backupBtn) backupBtn.style.display = 'inline-flex';
        if (restoreLabel) {
            restoreLabel.classList.remove('disabled');
            restoreLabel.style.display = 'inline-flex';
        }
        if (restoreInput) restoreInput.disabled = false;
        if (resetDataBtn) resetDataBtn.style.display = 'inline-flex';
    } else {
        addProductBtn.disabled = true;
        productFormCard.classList.add('locked');
        adminHint.textContent = 'Login sebagai admin untuk menambah/mengelola produk.';
        if (importInput) importInput.disabled = true;
        if (exportBtn) exportBtn.disabled = true;
        if (backupBtn) backupBtn.style.display = 'none';
        if (restoreLabel) {
            restoreLabel.classList.add('disabled');
            restoreLabel.style.display = 'none';
        }
        if (restoreInput) restoreInput.disabled = true;
        if (resetDataBtn) resetDataBtn.style.display = 'none';
    }

    // Perbarui daftar produk agar tombol edit/hapus mengikuti status admin
    loadProducts();
}

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('adminUsername').focus();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

function loginAdmin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        closeLoginModal();
        updateAuthUI();
        alert('Login admin berhasil.');
    } else {
        alert('Username atau password salah.');
    }
}

function logoutAdmin() {
    isAdmin = false;
    localStorage.removeItem('isAdmin');
    updateAuthUI();
    alert('Anda telah keluar dari mode admin.');
}

function requireAdmin() {
    if (!isAdmin) {
        alert('Hanya admin yang dapat melakukan aksi ini.');
        openLoginModal();
        return false;
    }
    return true;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const loginModal = document.getElementById('loginModal');
    const receiptModal = document.getElementById('receiptModal');
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === loginModal) {
        closeLoginModal();
    }
    if (event.target === receiptModal) {
        closeReceiptModal();
    }
}

