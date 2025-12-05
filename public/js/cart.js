// Cart Page JavaScript
const API_BASE = '/api';
let cart = [];
let orderType = 'takeaway';
let availableTables = [];
let selectedTable = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    updateCartUI();
    setupEventListeners();
    
    // Load order type from localStorage
    const savedType = localStorage.getItem('orderType') || 'takeaway';
    setOrderType(savedType);
    
    // Load available tables if needed
    if (savedType === 'dine-in') {
        await loadAvailableTables();
    }
});

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    // Update cart count in navigation
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
    
    // Show/hide empty cart message
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartItemsList = document.getElementById('cartItemsList');
    
    if (cart.length === 0) {
        if (emptyCartDiv) emptyCartDiv.style.display = 'block';
        if (cartItemsList) cartItemsList.innerHTML = '';
        updateSummary();
        return;
    }
    
    if (emptyCartDiv) emptyCartDiv.style.display = 'none';
    
    // Display cart items
    if (cartItemsList) {
        let itemsHtml = '';
        let subtotal = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            itemsHtml += `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-header">
                            <h3 class="cart-item-name">${item.name}</h3>
                            <span class="cart-item-price">Tsh ${item.price.toLocaleString()}</span>
                        </div>
                        <p class="cart-item-description">Kiasi: ${item.quantity}</p>
                        <div class="cart-item-controls">
                            <div class="quantity-selector">
                                <button class="qty-btn" onclick="updateItemQuantity(${index}, -1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateItemQuantity(${index}, 1)">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="cart-item-remove" onclick="removeItem(${index})">
                                <i class="fas fa-trash"></i> Ondoa
                            </button>
                            <span class="cart-item-total">Tsh ${itemTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartItemsList.innerHTML = itemsHtml;
    }
    
    // Update order summary
    updateSummary();
}

// Update item quantity
function updateItemQuantity(index, change) {
    if (index < 0 || index >= cart.length) return;
    
    const newQuantity = cart[index].quantity + change;
    
    if (newQuantity <= 0) {
        // Remove item if quantity becomes 0
        cart.splice(index, 1);
    } else {
        cart[index].quantity = newQuantity;
    }
    
    saveCart();
    showNotification('Cart imesasishwa');
}

// Remove item from cart
function removeItem(index) {
    if (index < 0 || index >= cart.length) return;
    
    if (confirm('Una uhakika unataka kuondoa hiki kitu kutoka kwenye cart?')) {
        cart.splice(index, 1);
        saveCart();
        showNotification('Kitu kimeondolewa kutoka kwenye cart');
    }
}

// Clear cart
function clearCart() {
    if (cart.length === 0) {
        showNotification('Cart tayari iko tupu');
        return;
    }
    
    if (confirm('Una uhakika unataka kufuta cart yako yote?')) {
        cart = [];
        saveCart();
        showNotification('Cart imefutwa kabisa');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Order type selection
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function() {
            const type = this.dataset.type;
            setOrderType(type);
        });
    });
    
    // Table selection
    document.addEventListener('click', function(e) {
        if (e.target.closest('.table-option')) {
            const tableOption = e.target.closest('.table-option');
            if (!tableOption.classList.contains('occupied')) {
                selectTable(tableOption.dataset.table);
            }
        }
    });
}

// Set order type
function setOrderType(type) {
    orderType = type;
    
    // Update UI
    document.querySelectorAll('.type-option').forEach(option => {
        option.classList.toggle('active', option.dataset.type === type);
    });
    
    // Show/hide extra options
    const dineInOptions = document.getElementById('dineInOptions');
    const deliveryOptions = document.getElementById('deliveryOptions');
    
    if (dineInOptions) {
        dineInOptions.style.display = type === 'dine-in' ? 'block' : 'none';
    }
    
    if (deliveryOptions) {
        deliveryOptions.style.display = type === 'delivery' ? 'block' : 'none';
    }
    
    // Load tables if needed
    if (type === 'dine-in') {
        loadAvailableTables();
    }
    
    // Save to localStorage
    localStorage.setItem('orderType', type);
    
    // Update summary
    updateSummary();
}

// Load available tables
async function loadAvailableTables() {
    try {
        const response = await fetch(`${API_BASE}/tables`);
        if (response.ok) {
            const data = await response.json();
            availableTables = data.data;
            populateTablesGrid();
        }
    } catch (error) {
        console.error('Error loading tables:', error);
        showError('Hitilafu katika kupakia meza zilizopo');
    }
}

// Populate tables grid
function populateTablesGrid() {
    const tablesGrid = document.getElementById('availableTables');
    const tableSelect = document.getElementById('tableSelect');
    
    if (!tablesGrid || !tableSelect) return;
    
    // Clear existing
    tablesGrid.innerHTML = '';
    tableSelect.innerHTML = '<option value="">Chagua meza...</option>';
    
    // Add tables
    availableTables.forEach(table => {
        // Add to grid
        const tableDiv = document.createElement('div');
        tableDiv.className = `table-option ${table.available ? '' : 'occupied'}`;
        tableDiv.dataset.table = table.number;
        tableDiv.innerHTML = `
            <div class="table-number">${table.number}</div>
            <div class="table-seats">${table.seats} kiti</div>
            <div class="table-status">${table.available ? 'Inapatikana' : 'Imejaa'}</div>
        `;
        tablesGrid.appendChild(tableDiv);
        
        // Add to select dropdown
        const option = document.createElement('option');
        option.value = table.number;
        option.textContent = `Meza ${table.number} (${table.seats} kiti) - ${table.available ? 'Inapatikana' : 'Imejaa'}`;
        option.disabled = !table.available;
        tableSelect.appendChild(option);
    });
    
    // Select change handler
    tableSelect.onchange = function() {
        if (this.value) {
            selectTable(this.value);
        }
    };
}

// Select table
function selectTable(tableNumber) {
    selectedTable = tableNumber;
    
    // Update UI
    document.querySelectorAll('.table-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.table === tableNumber);
    });
    
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
        tableSelect.value = tableNumber;
    }
    
    showNotification(`Meza ${tableNumber} imechaguliwa`);
}

// Update order summary
function updateSummary() {
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate delivery fee
    let deliveryFee = 0;
    if (orderType === 'delivery') {
        deliveryFee = subtotal > 10000 ? 0 : 2000; // Free delivery for orders above 10,000
    }
    
    // Calculate tax (18%)
    const taxRate = 0.18;
    const tax = subtotal * taxRate;
    
    // Calculate total
    const total = subtotal + deliveryFee + tax;
    
    // Update UI
    const subtotalEl = document.getElementById('summarySubtotal');
    const deliveryEl = document.getElementById('summaryDelivery');
    const taxEl = document.getElementById('summaryTax');
    const totalEl = document.getElementById('summaryTotal');
    
    if (subtotalEl) subtotalEl.textContent = `Tsh ${subtotal.toLocaleString()}`;
    if (deliveryEl) deliveryEl.textContent = `Tsh ${deliveryFee.toLocaleString()}`;
    if (taxEl) taxEl.textContent = `Tsh ${tax.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `Tsh ${total.toLocaleString()}`;
}

// Continue shopping
function continueShopping() {
    window.location.href = 'menu.html';
}

// Proceed to checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showError('Ongeza vyakula kwenye cart kwanza');
        return;
    }
    
    // Validate order type specific requirements
    if (orderType === 'dine-in' && !selectedTable) {
        showError('Tafadhali chagua meza');
        return;
    }
    
    if (orderType === 'delivery') {
        const address = document.getElementById('deliveryAddress')?.value.trim();
        if (!address) {
            showError('Tafadhali ingiza anwani ya upelekaji');
            return;
        }
    }
    
    // Collect order details
    const orderDetails = {
        cart: cart,
        orderType: orderType,
        tableNumber: orderType === 'dine-in' ? selectedTable : null,
        deliveryAddress: orderType === 'delivery' ? document.getElementById('deliveryAddress')?.value.trim() : null,
        deliveryInstructions: orderType === 'delivery' ? document.getElementById('deliveryInstructions')?.value.trim() : null,
        specialInstructions: document.getElementById('specialInstructions')?.value.trim() || '',
        subtotal: calculateSubtotal(),
        deliveryFee: calculateDeliveryFee(),
        tax: calculateTax(),
        total: calculateTotal()
    };
    
    // Save order details to localStorage
    localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Calculate subtotal
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate delivery fee
function calculateDeliveryFee() {
    const subtotal = calculateSubtotal();
    if (orderType !== 'delivery') return 0;
    return subtotal > 10000 ? 0 : 2000;
}

// Calculate tax
function calculateTax() {
    const subtotal = calculateSubtotal();
    return subtotal * 0.18; // 18% tax
}

// Calculate total
function calculateTotal() {
    return calculateSubtotal() + calculateDeliveryFee() + calculateTax();
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

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Make functions globally available
window.updateItemQuantity = updateItemQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.continueShopping = continueShopping;
window.proceedToCheckout = proceedToCheckout;
window.toggleMenu = toggleMenu;
