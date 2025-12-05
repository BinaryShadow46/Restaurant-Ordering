// Menu Page JavaScript
const API_BASE = '/api';
let menuItems = [];
let categories = [];
let currentCategory = 'all';
let currentFilters = {
    category: '',
    vegetarian: false,
    spicy: false,
    available: true
};
let cart = [];
let orderType = 'takeaway';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadMenuData();
    loadCart();
    setupEventListeners();
    updateCartUI();
    
    // Set order type from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const typeFromUrl = urlParams.get('type');
    if (typeFromUrl) {
        setOrderType(typeFromUrl);
    } else {
        const savedType = localStorage.getItem('orderType') || 'takeaway';
        setOrderType(savedType);
    }
});

// Load menu data
async function loadMenuData() {
    try {
        showLoading();
        
        // Load menu items
        const menuResponse = await fetch(`${API_BASE}/menu`);
        if (menuResponse.ok) {
            const menuData = await menuResponse.json();
            menuItems = menuData.data;
            
            // Extract unique categories
            const uniqueCategories = [...new Set(menuItems.map(item => item.category))];
            categories = uniqueCategories;
            
            // Load categories dropdown
            loadCategoriesFilter();
            
            // Load categories navigation
            loadCategoriesNav();
            
            // Display menu items
            displayMenuItems(menuItems);
        }
        
        // Load categories for filter
        const categoriesResponse = await fetch(`${API_BASE}/menu/categories`);
        if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            populateCategoryFilter(categoriesData.data);
        }
        
    } catch (error) {
        console.error('Error loading menu data:', error);
        showError('Hitilafu katika kupakia menyu. Tafadhali jaribu tena.');
        
        // Fallback: Use sample data
        loadFallbackData();
    } finally {
        hideLoading();
    }
}

// Load fallback data
function loadFallbackData() {
    menuItems = [
        {
            id: 1,
            name: "Chicken Biryani",
            description: "Fragrant basmati rice cooked with tender chicken",
            price: 1800,
            category: "Main Course",
            image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop",
            available: true,
            spicy: true,
            vegetarian: false,
            rating: 4.8
        },
        {
            id: 2,
            name: "Margherita Pizza",
            description: "Classic pizza with tomato sauce and mozzarella",
            price: 2200,
            category: "Italian",
            image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop",
            available: true,
            spicy: false,
            vegetarian: true,
            rating: 4.6
        }
    ];
    
    categories = ["Main Course", "Italian"];
    loadCategoriesFilter();
    loadCategoriesNav();
    displayMenuItems(menuItems);
}

// Load categories filter
function loadCategoriesFilter() {
    const categoriesNav = document.getElementById('categoriesNav');
    if (!categoriesNav) return;
    
    // Add "All" category
    categoriesNav.innerHTML = `
        <button class="category-btn active" data-category="all">
            Vyote
        </button>
    `;
    
    // Add each category
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.dataset.category = category;
        button.textContent = category;
        button.onclick = () => filterByCategory(category);
        categoriesNav.appendChild(button);
    });
}

// Populate category filter dropdown
function populateCategoryFilter(categoryList) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="">Kategoria Zote</option>';
    
    categoryList.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Load categories navigation
function loadCategoriesNav() {
    const categoriesNav = document.getElementById('categoriesNav');
    if (!categoriesNav) return;
    
    // Clear existing
    categoriesNav.innerHTML = '';
    
    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.textContent = 'Vyote';
    allButton.onclick = () => filterByCategory('all');
    categoriesNav.appendChild(allButton);
    
    // Add category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.onclick = () => filterByCategory(category);
        categoriesNav.appendChild(button);
    });
}

// Display menu items
function displayMenuItems(items) {
    const container = document.getElementById('menuItemsContainer');
    const noItemsMessage = document.getElementById('noItemsMessage');
    
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '';
        if (noItemsMessage) {
            noItemsMessage.style.display = 'block';
        }
        return;
    }
    
    if (noItemsMessage) {
        noItemsMessage.style.display = 'none';
    }
    
    // Group items by category
    const groupedItems = {};
    items.forEach(item => {
        if (!groupedItems[item.category]) {
            groupedItems[item.category] = [];
        }
        groupedItems[item.category].push(item);
    });
    
    // Build HTML
    let html = '';
    
    Object.keys(groupedItems).forEach(category => {
        html += `
            <div class="menu-category-section">
                <h2 class="category-title">${category}</h2>
                <div class="menu-items-grid">
        `;
        
        groupedItems[category].forEach(item => {
            const cartItem = cart.find(ci => ci.itemId === item.id);
            const quantity = cartItem ? cartItem.quantity : 0;
            
            html += `
                <div class="menu-item-card" data-id="${item.id}">
                    <div class="menu-item-image">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-badges">
                            ${!item.available ? `
                                <div class="badge unavailable">
                                    <i class="fas fa-times"></i> Haipatikani
                                </div>
                            ` : ''}
                            ${item.vegetarian ? `
                                <div class="badge veg">
                                    <i class="fas fa-leaf"></i> Mboga
                                </div>
                            ` : ''}
                            ${item.spicy ? `
                                <div class="badge spicy">
                                    <i class="fas fa-pepper-hot"></i> Spicy
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <h3 class="item-title">${item.name}</h3>
                            <span class="item-price">Tsh ${item.price.toLocaleString()}</span>
                        </div>
                        <p class="item-description">${item.description}</p>
                        <div class="item-meta">
                            <span class="item-category">${item.category}</span>
                            <span class="item-rating">
                                <i class="fas fa-star"></i> ${item.rating}
                            </span>
                        </div>
                        <div class="item-actions">
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)" ${quantity === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="qty-value">${quantity}</span>
                                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)" ${!item.available ? 'disabled' : ''}>
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="btn btn-primary" onclick="addToCart(${item.id})" ${!item.available ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus"></i> Ongeza
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`.category-btn[data-category="${category}"]`) ||
                        document.querySelector('.category-btn:first-child');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    applyFilters();
}

// Apply all filters
function applyFilters() {
    let filteredItems = [...menuItems];
    
    // Category filter
    if (currentCategory !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === currentCategory);
    }
    
    // Search filter
    const searchInput = document.getElementById('menuSearch');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category dropdown filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter.value);
    }
    
    // Vegetarian filter
    if (currentFilters.vegetarian) {
        filteredItems = filteredItems.filter(item => item.vegetarian);
    }
    
    // Spicy filter
    if (currentFilters.spicy) {
        filteredItems = filteredItems.filter(item => item.spicy);
    }
    
    // Available filter
    if (currentFilters.available) {
        filteredItems = filteredItems.filter(item => item.available);
    }
    
    displayMenuItems(filteredItems);
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('menuSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Toggle filter
            if (filter === 'vegetarian') {
                currentFilters.vegetarian = !currentFilters.vegetarian;
            } else if (filter === 'spicy') {
                currentFilters.spicy = !currentFilters.spicy;
            } else if (filter === 'available') {
                currentFilters.available = !currentFilters.available;
            }
            
            // Update button state
            this.classList.toggle('active', 
                (filter === 'vegetarian' && currentFilters.vegetarian) ||
                (filter === 'spicy' && currentFilters.spicy) ||
                (filter === 'available' && currentFilters.available)
            );
            
            applyFilters();
        });
    });
    
    // Order type selection
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function() {
            const type = this.dataset.type;
            setOrderType(type);
        });
    });
}

// Set order type
function setOrderType(type) {
    orderType = type;
    
    // Update UI
    document.querySelectorAll('.type-option').forEach(option => {
        option.classList.toggle('active', option.dataset.type === type);
    });
    
    // Save to localStorage
    localStorage.setItem('orderType', type);
    
    // Update delivery fee in cart
    updateCartUI();
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update all cart count elements
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
    
    document.querySelectorAll('.floating-cart-count').forEach(el => {
        el.textContent = totalItems;
    });
    
    // Update cart sidebar
    updateCartSidebar();
    
    // Update menu item quantities
    updateMenuItemQuantities();
}

// Update menu item quantities
function updateMenuItemQuantities() {
    cart.forEach(cartItem => {
        const itemElement = document.querySelector(`.menu-item-card[data-id="${cartItem.itemId}"]`);
        if (itemElement) {
            const qtyValue = itemElement.querySelector('.qty-value');
            const minusBtn = itemElement.querySelector('.qty-btn:first-child');
            
            if (qtyValue) qtyValue.textContent = cartItem.quantity;
            if (minusBtn) minusBtn.disabled = cartItem.quantity === 0;
        }
    });
}

// Add item to cart
function addToCart(itemId) {
    const menuItem = menuItems.find(item => item.id === itemId);
    if (!menuItem || !menuItem.available) return;
    
    const existingItem = cart.find(item => item.itemId === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            itemId: itemId,
            name: menuItem.name,
            price: menuItem.price,
            image: menuItem.image,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }
    
    saveCart();
    showNotification(`"${menuItem.name}" imeongezwa kwenye cart!`);
}

// Update item quantity
function updateQuantity(itemId, change) {
    const menuItem = menuItems.find(item => item.id === itemId);
    if (!menuItem) return;
    
    const cartItem = cart.find(item => item.itemId === itemId);
    
    if (!cartItem && change > 0) {
        // Add new item
        addToCart(itemId);
        return;
    }
    
    if (cartItem) {
        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity <= 0) {
            // Remove item from cart
            cart = cart.filter(item => item.itemId !== itemId);
        } else {
            cartItem.quantity = newQuantity;
        }
        
        saveCart();
    }
}

// Update cart sidebar
function updateCartSidebar() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const cartDeliveryElement = document.getElementById('cartDelivery');
    const cartGrandTotalElement = document.getElementById('cartGrandTotal');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Cart Iko Tupu</h3>
                <p>Ongeza vyakula kwenye cart yako</p>
            </div>
        `;
        
        if (cartTotalElement) cartTotalElement.textContent = 'Tsh 0';
        if (cartDeliveryElement) cartDeliveryElement.textContent = 'Tsh 0';
        if (cartGrandTotalElement) cartGrandTotalElement.textContent = 'Tsh 0';
        
        return;
    }
    
    // Calculate totals
    let subtotal = 0;
    let itemsHtml = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        itemsHtml += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">Tsh ${item.price.toLocaleString()} × ${item.quantity}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity(${item.itemId}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.itemId}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="cart-item-remove" onclick="removeFromCart(${item.itemId})">
                            <i class="fas fa-trash"></i> Ondoa
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Calculate delivery fee
    const deliveryFee = orderType === 'delivery' ? (subtotal > 10000 ? 0 : 2000) : 0;
    const grandTotal = subtotal + deliveryFee;
    
    // Update UI
    cartItemsContainer.innerHTML = itemsHtml;
    
    if (cartTotalElement) cartTotalElement.textContent = `Tsh ${subtotal.toLocaleString()}`;
    if (cartDeliveryElement) cartDeliveryElement.textContent = `Tsh ${deliveryFee.toLocaleString()}`;
    if (cartGrandTotalElement) cartGrandTotalElement.textContent = `Tsh ${grandTotal.toLocaleString()}`;
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.itemId !== itemId);
    saveCart();
    showNotification('Kitu kimeondolewa kutoka kwenye cart');
}

// Clear cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Una uhakika unataka kufuta cart yako yote?')) {
        cart = [];
        saveCart();
        showNotification('Cart imefutwa');
    }
}

// Toggle cart sidebar
function toggleCart() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

function closeCart() {
    const sidebar = document.querySelector('.cart-sidebar');
    const overlay = document.querySelector('.cart-overlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

// Go to checkout
function goToCheckout() {
    if (cart.length === 0) {
        showNotification('Ongeza vyakula kwenye cart kwanza');
        return;
    }
    
    // Save cart and order type
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('orderType', orderType);
    
    // Redirect to checkout
    window.location.href = 'checkout.html';
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

// Show loading
function showLoading() {
    // Implement loading spinner if needed
}

function hideLoading() {
    // Hide loading spinner if implemented
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

// Make functions globally available
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.goToCheckout = goToCheckout;
window.toggleMenu = toggleMenu;
