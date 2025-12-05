// Admin Dashboard JavaScript
const API_BASE = '/api';
let allOrders = [];
let allMenuItems = [];
let currentPage = 1;
const itemsPerPage = 10;
let revenueChart = null;
let systemStartTime = Date.now();

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin (simplified authentication)
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    
    if (!isAuthenticated) {
        // Simple password prompt for demo
        const password = prompt('Ingia kama Msimamizi (Neno la siri: admin123)');
        if (password === 'admin123') {
            localStorage.setItem('adminAuthenticated', 'true');
        } else {
            alert('Neno la siri si sahihi. Unaelekezwa kwenye ukurasa wa nyumbani.');
            window.location.href = 'index.html';
            return;
        }
    }
    
    // Load initial data
    await loadDashboardData();
    setupEventListeners();
    startSystemUptime();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
});

// Load all dashboard data
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load orders
        const ordersResponse = await fetch(`${API_BASE}/orders`);
        if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            allOrders = ordersData.data;
            displayOrders(currentPage);
            updateOrdersCount();
        }
        
        // Load menu items
        const menuResponse = await fetch(`${API_BASE}/menu`);
        if (menuResponse.ok) {
            const menuData = await menuResponse.json();
            allMenuItems = menuData.data;
            displayMenuItems();
            updateMenuItemsCount();
        }
        
        // Load statistics
        const statsResponse = await fetch(`${API_BASE}/stats`);
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            updateDashboardStats(statsData.data);
        }
        
        // Load analytics
        await loadAnalytics();
        
        // Update system info
        updateSystemInfo();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Hitilafu katika kupakia data ya dashboard');
        
        // Fallback: Use sample data
        loadFallbackData();
        
    } finally {
        hideLoading();
    }
}

// Load fallback data
function loadFallbackData() {
    // Sample orders
    allOrders = [
        {
            id: '1',
            orderNumber: 'ORD1001',
            customerName: 'John Mwamba',
            customerPhone: '0712345678',
            totalAmount: 4500,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            items: [
                { name: 'Chicken Biryani', quantity: 1, price: 1800 },
                { name: 'Mango Lassi', quantity: 2, price: 500 }
            ]
        },
        {
            id: '2',
            orderNumber: 'ORD1002',
            customerName: 'Sarah Chuma',
            customerPhone: '0723456789',
            totalAmount: 2200,
            status: 'preparing',
            paymentStatus: 'paid',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            items: [
                { name: 'Margherita Pizza', quantity: 1, price: 2200 }
            ]
        }
    ];
    
    // Sample menu items
    allMenuItems = [
        {
            id: 1,
            name: 'Chicken Biryani',
            description: 'Fragrant basmati rice cooked with tender chicken',
            price: 1800,
            category: 'Main Course',
            image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop',
            available: true,
            vegetarian: false,
            spicy: true,
            rating: 4.8
        },
        {
            id: 2,
            name: 'Margherita Pizza',
            description: 'Classic pizza with tomato sauce and mozzarella',
            price: 2200,
            category: 'Italian',
            image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop',
            available: true,
            vegetarian: true,
            spicy: false,
            rating: 4.6
        }
    ];
    
    displayOrders(currentPage);
    displayMenuItems();
    updateDashboardStats({
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(o => o.status === 'pending').length,
        todayOrders: allOrders.length,
        totalRevenue: allOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search orders
    const searchInput = document.getElementById('searchOrders');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchOrders, 300));
    }
    
    // Filter by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrders);
    }
    
    // Filter by date
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterOrders);
    }
    
    // Chart period
    const chartPeriod = document.getElementById('chartPeriod');
    if (chartPeriod) {
        chartPeriod.addEventListener('change', loadAnalytics);
    }
}

// Display orders with pagination
function displayOrders(page) {
    const ordersTableBody = document.getElementById('ordersTableBody');
    const noOrdersDiv = document.getElementById('noOrders');
    const pageInfo = document.getElementById('pageInfo');
    
    if (!ordersTableBody || !noOrdersDiv) return;
    
    // Filter orders based on current filters
    let filteredOrders = filterOrdersByCriteria(allOrders);
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    // Update pagination info
    if (pageInfo) {
        pageInfo.textContent = `Safu ${page} ya ${totalPages}`;
    }
    
    // Enable/disable pagination buttons
    updatePaginationButtons(page, totalPages);
    
    if (pageOrders.length === 0) {
        ordersTableBody.innerHTML = '';
        noOrdersDiv.style.display = 'block';
        return;
    }
    
    noOrdersDiv.style.display = 'none';
    
    // Build orders table
    let ordersHtml = '';
    
    pageOrders.forEach((order, index) => {
        const orderIndex = startIndex + index + 1;
        const orderDate = new Date(order.createdAt).toLocaleDateString('sw-TZ');
        const orderTime = new Date(order.createdAt).toLocaleTimeString('sw-TZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        ordersHtml += `
            <tr>
                <td>${orderIndex}</td>
                <td>
                    <strong>${order.orderNumber}</strong><br>
                    <small>${orderDate} ${orderTime}</small>
                </td>
                <td>
                    <strong>${order.customerName}</strong><br>
                    <small>${order.customerPhone}</small>
                </td>
                <td>${orderDate}</td>
                <td>Tsh ${order.totalAmount.toLocaleString()}</td>
                <td>
                    <span class="order-status status-${order.status}">
                        ${getStatusText(order.status)}
                    </span>
                </td>
                <td>
                    <span class="payment-status payment-${order.paymentStatus}">
                        ${getPaymentStatusText(order.paymentStatus)}
                    </span>
                </td>
                <td>
                    <div class="order-actions">
                        <button class="action-icon action-view" onclick="viewOrder('${order.id}')" title="Angalia">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon action-edit" onclick="updateOrderStatus('${order.id}')" title="Badilisha Hali">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon action-delete" onclick="cancelOrder('${order.id}')" title="Ghairi" ${order.status === 'cancelled' || order.status === 'completed' ? 'disabled' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    ordersTableBody.innerHTML = ordersHtml;
}

// Filter orders by criteria
function filterOrdersByCriteria(orders) {
    let filtered = [...orders];
    
    // Search filter
    const searchTerm = document.getElementById('searchOrders')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.orderNumber.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerPhone.includes(searchTerm)
        );
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter')?.value;
    if (statusFilter) {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter')?.value;
    if (dateFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter) {
            case 'today':
                filtered = filtered.filter(order => 
                    new Date(order.createdAt) >= today
                );
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                filtered = filtered.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= yesterday && orderDate < today;
                });
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                filtered = filtered.filter(order => 
                    new Date(order.createdAt) >= weekAgo
                );
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                filtered = filtered.filter(order => 
                    new Date(order.createdAt) >= monthAgo
                );
                break;
            // 'all' shows all orders
        }
    }
    
    // Sort by latest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return filtered;
}

// Search orders
function searchOrders() {
    currentPage = 1;
    displayOrders(currentPage);
}

// Filter orders
function filterOrders() {
    currentPage = 1;
    displayOrders(currentPage);
}

// Update pagination buttons
function updatePaginationButtons(currentPage, totalPages) {
    const prevBtn = document.querySelector('.page-btn:first-child');
    const nextBtn = document.querySelector('.page-btn:last-child');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }
}

// Next page
function nextPage() {
    const filteredOrders = filterOrdersByCriteria(allOrders);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        displayOrders(currentPage);
    }
}

// Previous page
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayOrders(currentPage);
    }
}

// Display menu items
function displayMenuItems() {
    const menuTableBody = document.getElementById('menuTableBody');
    if (!menuTableBody) return;
    
    let menuHtml = '';
    
    allMenuItems.forEach(item => {
        menuHtml += `
            <tr>
                <td>
                    <div class="menu-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                </td>
                <td>
                    <strong>${item.name}</strong><br>
                    <small>${item.description.substring(0, 50)}...</small>
                </td>
                <td>${item.category}</td>
                <td>Tsh ${item.price.toLocaleString()}</td>
                <td>
                    <label class="availability-toggle">
                        <input type="checkbox" ${item.available ? 'checked' : ''} 
                               onchange="toggleAvailability(${item.id}, this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td>
                    <div class="order-actions">
                        <button class="action-icon action-edit" onclick="editMenuItem(${item.id})" title="Hariri">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon action-delete" onclick="deleteMenuItem(${item.id})" title="Futa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    menuTableBody.innerHTML = menuHtml;
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    // Update quick stats
    document.getElementById('totalOrders').textContent = stats.todayOrders || 0;
    document.getElementById('todayRevenue').textContent = `Tsh ${(stats.totalRevenue || 0).toLocaleString()}`;
    document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
    document.getElementById('totalCustomers').textContent = stats.totalPatients || 0;
    
    // Update status counts
    document.getElementById('countPending').textContent = stats.pending || 0;
    document.getElementById('countPreparing').textContent = stats.preparingOrders || 0;
    document.getElementById('countReady').textContent = stats.readyOrders || 0;
    document.getElementById('countCompleted').textContent = stats.completed || 0;
    
    // Update system info
    document.getElementById('totalOrdersCount').textContent = stats.totalOrders || 0;
}

// Update orders count
function updateOrdersCount() {
    const totalOrders = allOrders.length;
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter(order => 
        order.createdAt.startsWith(today)
    ).length;
    const pendingOrders = allOrders.filter(order => 
        order.status === 'pending'
    ).length;
    
    document.getElementById('totalOrders').textContent = todayOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
}

// Update menu items count
function updateMenuItemsCount() {
    document.getElementById('totalMenuItems').textContent = allMenuItems.length;
}

// Load analytics data
async function loadAnalytics() {
    try {
        const period = document.getElementById('chartPeriod')?.value || 'day';
        let revenueData = [];
        let labels = [];
        
        // For demo, generate sample data based on period
        const now = new Date();
        
        switch (period) {
            case 'day':
                // Last 24 hours in 2-hour intervals
                for (let i = 23; i >= 0; i -= 2) {
                    const hour = new Date(now);
                    hour.setHours(hour.getHours() - i);
                    labels.push(hour.getHours() + ':00');
                    revenueData.push(Math.floor(Math.random() * 50000) + 10000);
                }
                break;
                
            case 'week':
                // Last 7 days
                const days = ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'];
                for (let i = 6; i >= 0; i--) {
                    const day = new Date(now);
                    day.setDate(day.getDate() - i);
                    labels.push(days[day.getDay()]);
                    revenueData.push(Math.floor(Math.random() * 200000) + 50000);
                }
                break;
                
            case 'month':
                // Last 30 days in weekly intervals
                for (let i = 4; i >= 0; i--) {
                    const week = new Date(now);
                    week.setDate(week.getDate() - (i * 7));
                    labels.push(`Wiki ${5 - i}`);
                    revenueData.push(Math.floor(Math.random() * 500000) + 100000);
                }
                break;
        }
        
        // Create or update chart
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        if (revenueChart) {
            revenueChart.destroy();
        }
        
        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mapato (Tsh)',
                    data: revenueData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Mapato: Tsh ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Tsh ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update system info
function updateSystemInfo() {
    // Update API status
    fetch(`${API_BASE}/health`)
        .then(response => {
            const statusElement = document.getElementById('apiStatus');
            if (statusElement) {
                if (response.ok) {
                    statusElement.textContent = 'Inatumika';
                    statusElement.style.color = '#10b981';
                } else {
                    statusElement.textContent = 'Haipatikani';
                    statusElement.style.color = '#ef4444';
                }
            }
        })
        .catch(() => {
            const statusElement = document.getElementById('apiStatus');
            if (statusElement) {
                statusElement.textContent = 'Haipatikani';
                statusElement.style.color = '#ef4444';
            }
        });
    
    // Update last order time
    if (allOrders.length > 0) {
        const lastOrder = allOrders.reduce((latest, order) => 
            new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest
        );
        
        const lastOrderTime = new Date(lastOrder.createdAt).toLocaleTimeString('sw-TZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('lastOrderTime').textContent = lastOrderTime;
    }
}

// Start system uptime counter
function startSystemUptime() {
    setInterval(() => {
        const uptime = Math.floor((Date.now() - systemStartTime) / 1000);
        document.getElementById('systemUptime').textContent = `${uptime} s`;
        document.getElementById('footerUptime').textContent = `${uptime} s`;
    }, 1000);
}

// View order details
async function viewOrder(orderId) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`);
        if (response.ok) {
            const orderData = await response.json();
            const order = orderData.data;
            
            const detailsContent = document.getElementById('orderDetailsContent');
            if (detailsContent) {
                const orderDate = new Date(order.createdAt).toLocaleDateString('sw-TZ');
                const orderTime = new Date(order.createdAt).toLocaleTimeString('sw-TZ', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                detailsContent.innerHTML = `
                    <div class="order-details">
                        <div class="detail-section">
                            <h4><i class="fas fa-info-circle"></i> Maelezo ya Agizo</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="label">Namba ya Agizo:</span>
                                    <span class="value">${order.orderNumber}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Mteja:</span>
                                    <span class="value">${order.customerName}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Simu:</span>
                                    <span class="value">${order.customerPhone}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Tarehe na Muda:</span>
                                    <span class="value">${orderDate} ${orderTime}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Aina ya Agizo:</span>
                                    <span class="value">${getOrderTypeText(order.orderType)}</span>
                                </div>
                                ${order.tableNumber ? `
                                <div class="detail-item">
                                    <span class="label">Meza:</span>
                                    <span class="value">${order.tableNumber}</span>
                                </div>
                                ` : ''}
                                ${order.deliveryAddress ? `
                                <div class="detail-item">
                                    <span class="label">Anwani:</span>
                                    <span class="value">${order.deliveryAddress}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-utensils"></i> Vitu vya Agizo</h4>
                            <div class="items-list">
                                ${order.items.map(item => `
                                    <div class="item-row">
                                        <span class="item-name">${item.name}</span>
                                        <span class="item-quantity">${item.quantity} × Tsh ${item.price.toLocaleString()}</span>
                                        <span class="item-total">Tsh ${(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="fas fa-money-bill-wave"></i> Malipo</h4>
                            <div class="payment-details">
                                <div class="detail-item">
                                    <span class="label">Jumla ya Vitu:</span>
                                    <span class="value">Tsh ${order.totalAmount.toLocaleString()}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Hali ya Agizo:</span>
                                    <span class="value">
                                        <span class="order-status status-${order.status}">
                                            ${getStatusText(order.status)}
                                        </span>
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">Hali ya Malipo:</span>
                                    <span class="value">
                                        <span class="payment-status payment-${order.paymentStatus}">
                                            ${getPaymentStatusText(order.paymentStatus)}
                                        </span>
                                    </span>
                                </div>
                                ${order.specialInstructions ? `
                                <div class="detail-item">
                                    <span class="label">Maelezo Maalum:</span>
                                    <span class="value">${order.specialInstructions}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                // Show modal
                const modal = document.getElementById('orderDetailsModal');
                modal.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        showError('Hitilafu katika kupakia maelezo ya agizo');
    }
}

// Close order modal
function closeOrderModal() {
    const modal = document.getElementById('orderDetailsModal');
    modal.style.display = 'none';
}

// Print order
function printOrder() {
    const orderDetails = document.querySelector('.order-details').outerHTML;
    const printContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="text-align: center; color: #f59e0b;">🍽️ Delicious Restaurant</h2>
            <h3 style="text-align: center;">Risiti ya Agizo la Msimamizi</h3>
            ${orderDetails}
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Update order status
async function updateOrderStatus(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const currentStatus = order.status;
    const statusOptions = [
        { value: 'pending', label: 'Inasubiri' },
        { value: 'confirmed', label: 'Imethibitishwa' },
        { value: 'preparing', label: 'Inatayarishwa' },
        { value: 'ready', label: 'Imetayarishwa' },
        { value: 'delivered', label: 'Imefikishwa' },
        { value: 'completed', label: 'Imekamilika' },
        { value: 'cancelled', label: 'Imeghairiwa' }
    ];
    
    const statusList = statusOptions.map(opt => 
        `<option value="${opt.value}" ${opt.value === currentStatus ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
    
    const newStatus = prompt(
        `Badilisha hali ya agizo ${order.orderNumber}:\n\n${statusOptions.map(opt => `${opt.value}: ${opt.label}`).join('\n')}`,
        currentStatus
    );
    
    if (newStatus && newStatus !== currentStatus && statusOptions.some(opt => opt.value === newStatus)) {
        try {
            const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                showNotification(`Hali ya agizo imebadilishwa kuwa ${getStatusText(newStatus)}`);
                loadDashboardData();
            } else {
                showError('Hitilafu katika kubadilisha hali ya agizo');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            showError('Hitilafu ya mtandao');
        }
    }
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Una uhakika unataka kughairi agizo hili?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (response.ok) {
            showNotification('Agizo limeghairiwa');
            loadDashboardData();
        } else {
            showError('Hitilafu katika kughairi agizo');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showError('Hitilafu ya mtandao');
    }
}

// Toggle menu item availability
async function toggleAvailability(itemId, available) {
    try {
        // In a real app, you would update via API
        const item = allMenuItems.find(m => m.id === itemId);
        if (item) {
            item.available = available;
            showNotification(`${item.name} sasa ${available ? 'inapatikana' : 'haipatikani'}`);
        }
    } catch (error) {
        console.error('Error toggling availability:', error);
        showError('Hitilafu katika kubadilisha hali ya kipya');
    }
}

// Show add menu item modal
async function showAddItemModal() {
    const modal = document.getElementById('menuItemModal');
    const form = document.getElementById('menuItemForm');
    const title = modal.querySelector('h3');
    const categories = await getCategories();
    
    // Reset form
    form.reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemAvailable').checked = true;
    document.getElementById('itemVegetarian').checked = false;
    document.getElementById('itemSpicy').checked = false;
    document.getElementById('itemRating').value = '4.0';
    
    // Populate categories
    const categorySelect = document.getElementById('itemCategory');
    categorySelect.innerHTML = '<option value="">Chagua kategoria</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Update title
    title.innerHTML = '<i class="fas fa-utensils"></i> Ongeza Kipya kwenye Menyu';
    
    // Show modal
    modal.style.display = 'flex';
}

// Edit menu item
async function editMenuItem(itemId) {
    const item = allMenuItems.find(m => m.id === itemId);
    if (!item) return;
    
    const modal = document.getElementById('menuItemModal');
    const form = document.getElementById('menuItemForm');
    const title = modal.querySelector('h3');
    const categories = await getCategories();
    
    // Fill form with item data
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImage').value = item.image;
    document.getElementById('itemRating').value = item.rating;
    document.getElementById('itemAvailable').checked = item.available;
    document.getElementById('itemVegetarian').checked = item.vegetarian;
    document.getElementById('itemSpicy').checked = item.spicy;
    
    // Populate categories
    const categorySelect = document.getElementById('itemCategory');
    categorySelect.innerHTML = '<option value="">Chagua kategoria</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        option.selected = category === item.category;
        categorySelect.appendChild(option);
    });
    
    // Update title
    title.innerHTML = `<i class="fas fa-edit"></i> Hariri ${item.name}`;
    
    // Show modal
    modal.style.display = 'flex';
}

// Get categories
async function getCategories() {
    try {
        const response = await fetch(`${API_BASE}/menu/categories`);
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    
    // Fallback categories
    return ['Main Course', 'Italian', 'Fast Food', 'Salads', 'Desserts', 'Drinks', 'Grills'];
}

// Save menu item
async function saveMenuItem() {
    const form = document.getElementById('menuItemForm');
    const itemId = document.getElementById('itemId').value;
    const isEdit = !!itemId;
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const menuItem = {
        name: document.getElementById('itemName').value.trim(),
        description: document.getElementById('itemDescription').value.trim(),
        price: parseFloat(document.getElementById('itemPrice').value),
        category: document.getElementById('itemCategory').value,
        image: document.getElementById('itemImage').value.trim() || 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
        available: document.getElementById('itemAvailable').checked,
        vegetarian: document.getElementById('itemVegetarian').checked,
        spicy: document.getElementById('itemSpicy').checked,
        rating: parseFloat(document.getElementById('itemRating').value)
    };
    
    try {
        if (isEdit) {
            // Update existing item
            const response = await fetch(`${API_BASE}/admin/menu/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(menuItem)
            });
            
            if (response.ok) {
                showNotification('Kipya kimehaririwa kikamilifu');
                closeMenuItemModal();
                loadDashboardData();
            } else {
                showError('Hitilafu katika kuhariri kipya');
            }
        } else {
            // Add new item
            const response = await fetch(`${API_BASE}/admin/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(menuItem)
            });
            
            if (response.ok) {
                showNotification('Kipya kimeongezwa kikamilifu');
                closeMenuItemModal();
                loadDashboardData();
            } else {
                showError('Hitilafu katika kuongeza kipya');
            }
        }
    } catch (error) {
        console.error('Error saving menu item:', error);
        showError('Hitilafu ya mtandao');
        
        // Fallback: Update locally
        if (isEdit) {
            const index = allMenuItems.findIndex(m => m.id === parseInt(itemId));
            if (index !== -1) {
                allMenuItems[index] = { ...allMenuItems[index], ...menuItem };
            }
        } else {
            const newId = allMenuItems.length > 0 ? Math.max(...allMenuItems.map(m => m.id)) + 1 : 1;
            allMenuItems.push({ id: newId, ...menuItem });
        }
        
        showNotification(`Kipya ${isEdit ? 'kimehaririwa' : 'kimeongezwa'} (offline)`);
        closeMenuItemModal();
        displayMenuItems();
    }
}

// Delete menu item
async function deleteMenuItem(itemId) {
    if (!confirm('Una uhakika unataka kufuta kipya hiki?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/menu/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Kipya kimefutwa');
            loadDashboardData();
        } else {
            showError('Hitilafu katika kufuta kipya');
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showError('Hitilafu ya mtandao');
        
        // Fallback: Delete locally
        allMenuItems = allMenuItems.filter(m => m.id !== itemId);
        showNotification('Kipya kimefutwa (offline)');
        displayMenuItems();
    }
}

// Close menu item modal
function closeMenuItemModal() {
    const modal = document.getElementById('menuItemModal');
    modal.style.display = 'none';
}

// Manage tables
async function manageTables() {
    try {
        const response = await fetch(`${API_BASE}/tables`);
        if (response.ok) {
            const data = await response.json();
            displayTables(data.data);
            
            const modal = document.getElementById('tablesModal');
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading tables:', error);
        showError('Hitilafu katika kupakia meza');
    }
}

// Display tables
function displayTables(tables) {
    const tablesGrid = document.getElementById('tablesGrid');
    if (!tablesGrid) return;
    
    let tablesHtml = '';
    
    tables.forEach(table => {
        tablesHtml += `
            <div class="table-card ${table.available ? 'available' : 'occupied'}">
                <div class="table-number">${table.number}</div>
                <div class="table-seats">${table.seats} kiti</div>
                <div class="table-status ${table.available ? 'available' : 'occupied'}">
                    ${table.available ? 'Inapatikana' : 'Imejaa'}
                </div>
                <div class="table-actions">
                    <button class="btn btn-sm ${table.available ? 'btn-secondary' : 'btn-success'}" 
                            onclick="toggleTableStatus('${table.number}', ${!table.available})">
                        ${table.available ? 'Jaza' : 'Tumua'}
                    </button>
                </div>
            </div>
        `;
    });
    
    tablesGrid.innerHTML = tablesHtml;
}

// Toggle table status
async function toggleTableStatus(tableNumber, makeAvailable) {
    try {
        const endpoint = makeAvailable ? '/api/tables/free' : '/api/tables/reserve';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableNumber })
        });
        
        if (response.ok) {
            showNotification(`Meza ${tableNumber} ${makeAvailable ? 'imetumiwa' : 'imejazwa'}`);
            manageTables(); // Refresh tables
        } else {
            showError('Hitilafu katika kubadilisha hali ya meza');
        }
    } catch (error) {
        console.error('Error toggling table status:', error);
        showError('Hitilafu ya mtandao');
    }
}

// Close tables modal
function closeTablesModal() {
    const modal = document.getElementById('tablesModal');
    modal.style.display = 'none';
}

// Add table
function addTable() {
    const tableNumber = prompt('Ingiza namba ya meza mpya:');
    if (!tableNumber) return;
    
    const seats = prompt('Ingiza idadi ya viti:');
    if (!seats || isNaN(seats)) return;
    
    alert(`Meza ${tableNumber} itaongezwa katika toleo la baadaye.`);
}

// Export orders
function exportOrders() {
    const filteredOrders = filterOrdersByCriteria(allOrders);
    const dataStr = JSON.stringify(filteredOrders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `orders_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Agizo zimepakuliwa');
}

// Refresh orders
function refreshOrders() {
    loadDashboardData();
    showNotification('Data imesasishwa');
}

// Show all orders
function showAllOrders() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = 'all';
    filterOrders();
}

// Show pending orders
function showPendingOrders() {
    document.getElementById('statusFilter').value = 'pending';
    filterOrders();
}

// Show today's revenue
function showTodayRevenue() {
    document.getElementById('dateFilter').value = 'today';
    filterOrders();
}

// Clear database (for testing)
function clearDatabase() {
    if (!confirm('HII ITAFUTA DATA YOTE! Una uhakika?')) return;
    
    if (!confirm('KWELI UNAHAKIKA? Hii haitaweza kutenduliwa!')) return;
    
    alert('Kazi hii haijakamilika bado. Katika mfumo wa kweli, ungependa kufuta data kwa kutumia API.');
}

// Reset system
function resetSystem() {
    if (!confirm('Hii itaweka upya mfumo wote. Una uhakika?')) {
        return;
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Reload page
    window.location.reload();
}

// Logout
function logout() {
    localStorage.removeItem('adminAuthenticated');
    window.location.href = 'index.html';
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'Inasubiri',
        'confirmed': 'Imethibitishwa',
        'preparing': 'Inatayarishwa',
        'ready': 'Imetayarishwa',
        'delivered': 'Imefikishwa',
        'completed': 'Imekamilika',
        'cancelled': 'Imeghairiwa'
    };
    return statusMap[status] || status;
}

function getPaymentStatusText(status) {
    const statusMap = {
        'pending': 'Inasubiri',
        'paid': 'Imelipwa',
        'refunded': 'Imerudishwa'
    };
    return statusMap[status] || status;
}

function getOrderTypeText(type) {
    const typeMap = {
        'dine-in': 'Kukaa Ndani',
        'takeaway': 'Kuchukua Nje',
        'delivery': 'Upelekaji'
    };
    return typeMap[type] || type;
}

// Show loading
function showLoading() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Inapakia...</p>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            .loading-spinner {
                text-align: center;
            }
            .loading-spinner i {
                font-size: 3rem;
                color: var(--primary);
                margin-bottom: 1rem;
            }
            .loading-spinner p {
                font-weight: 500;
                color: var(--gray-700);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Show error
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 6rem;
        right: 2rem;
        background: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transform: translateX(100%);
        opacity: 0;
        transition: var(--transition);
    }
    .notification.error {
        background: var(--danger);
    }
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
`;
document.head.appendChild(notificationStyles);

// Make functions globally available
window.nextPage = nextPage;
window.prevPage = prevPage;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;
window.toggleAvailability = toggleAvailability;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.showAddItemModal = showAddItemModal;
window.saveMenuItem = saveMenuItem;
window.closeMenuItemModal = closeMenuItemModal;
window.closeOrderModal = closeOrderModal;
window.printOrder = printOrder;
window.manageTables = manageTables;
window.closeTablesModal = closeTablesModal;
window.toggleTableStatus = toggleTableStatus;
window.addTable = addTable;
window.exportOrders = exportOrders;
window.refreshOrders = refreshOrders;
window.showAllOrders = showAllOrders;
window.showPendingOrders = showPendingOrders;
window.showTodayRevenue = showTodayRevenue;
window.clearDatabase = clearDatabase;
window.resetSystem = resetSystem;
window.logout = logout;
window.toggleMenu = toggleMenu;
