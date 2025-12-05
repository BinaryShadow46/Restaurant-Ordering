// Checkout Page JavaScript
const API_BASE = '/api';
let orderDetails = null;
let cart = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadOrderDetails();
    setupEventListeners();
    updateCheckoutUI();
});

// Load order details
async function loadOrderDetails() {
    try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        
        // Load order details from localStorage
        const savedDetails = localStorage.getItem('orderDetails');
        orderDetails = savedDetails ? JSON.parse(savedDetails) : null;
        
        if (!orderDetails && cart.length > 0) {
            // Create order details from cart
            orderDetails = {
                cart: cart,
                orderType: localStorage.getItem('orderType') || 'takeaway',
                subtotal: calculateSubtotal(),
                deliveryFee: calculateDeliveryFee(),
                tax: calculateTax(),
                total: calculateTotal()
            };
        }
        
        if (cart.length === 0 && !orderDetails) {
            // Redirect to menu if cart is empty
            showError('Cart yako iko tupu. Ongeza vyakula kwanza.');
            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 3000);
            return;
        }
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Hitilafu katika kupakia maelezo ya agizo.');
    }
}

// Calculate subtotal
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate delivery fee
function calculateDeliveryFee() {
    const subtotal = calculateSubtotal();
    const orderType = orderDetails?.orderType || 'takeaway';
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

// Setup event listeners
function setupEventListeners() {
    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            selectPaymentMethod(this.dataset.method);
        });
    });
    
    // Payment method radio buttons
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectPaymentMethod(this.value);
        });
    });
    
    // Form submission
    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitOrder();
        });
    }
    
    // Phone input formatting
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            e.target.value = value;
        });
    }
    
    // M-Pesa number formatting
    const mpesaInput = document.getElementById('mpesaNumber');
    if (mpesaInput) {
        mpesaInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            e.target.value = value;
        });
    }
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})/g, '$1 ').trim();
            if (value.length > 19) value = value.substring(0, 19);
            e.target.value = value;
        });
    }
    
    // Card expiry formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            if (value.length > 5) value = value.substring(0, 5);
            e.target.value = value;
        });
    }
    
    // Card CVC formatting
    const cardCVCInput = document.getElementById('cardCVC');
    if (cardCVCInput) {
        cardCVCInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 3) value = value.substring(0, 3);
            e.target.value = value;
        });
    }
}

// Update checkout UI
function updateCheckoutUI() {
    if (!orderDetails) return;
    
    // Display order type
    displayOrderType();
    
    // Display order summary
    displayOrderSummary();
    
    // Display order items in sidebar
    displayOrderItems();
    
    // Update price breakdown
    updatePriceBreakdown();
    
    // Update estimated time
    updateEstimatedTime();
}

// Display order type
function displayOrderType() {
    const orderTypeDisplay = document.getElementById('orderTypeDisplay');
    if (!orderTypeDisplay || !orderDetails) return;
    
    const type = orderDetails.orderType || 'takeaway';
    let icon, text;
    
    switch (type) {
        case 'dine-in':
            icon = 'fa-chair';
            text = 'Kukaa Ndani';
            if (orderDetails.tableNumber) {
                text += ` (Meza ${orderDetails.tableNumber})`;
            }
            break;
        case 'delivery':
            icon = 'fa-motorcycle';
            text = 'Upelekaji';
            if (orderDetails.deliveryAddress) {
                text += ` - ${orderDetails.deliveryAddress.substring(0, 30)}...`;
            }
            break;
        case 'takeaway':
        default:
            icon = 'fa-box';
            text = 'Kuchukua Nje';
    }
    
    orderTypeDisplay.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${text}</span>
    `;
}

// Display order summary
function displayOrderSummary() {
    const orderSummary = document.getElementById('orderSummaryCheckout');
    if (!orderSummary || !orderDetails) return;
    
    let summaryHtml = '';
    
    if (orderDetails.orderType === 'dine-in' && orderDetails.tableNumber) {
        summaryHtml += `
            <div class="summary-item">
                <span><i class="fas fa-chair"></i> Meza:</span>
                <span>${orderDetails.tableNumber}</span>
            </div>
        `;
    }
    
    if (orderDetails.orderType === 'delivery' && orderDetails.deliveryAddress) {
        summaryHtml += `
            <div class="summary-item">
                <span><i class="fas fa-map-marker-alt"></i> Anwani:</span>
                <span>${orderDetails.deliveryAddress.substring(0, 50)}...</span>
            </div>
        `;
    }
    
    if (orderDetails.specialInstructions) {
        summaryHtml += `
            <div class="summary-item">
                <span><i class="fas fa-sticky-note"></i> Maelezo:</span>
                <span>${orderDetails.specialInstructions.substring(0, 50)}...</span>
            </div>
        `;
    }
    
    orderSummary.innerHTML = summaryHtml || '<p>Hakuna maelezo ya ziada</p>';
}

// Display order items in sidebar
function displayOrderItems() {
    const orderItemsSummary = document.getElementById('orderItemsSummary');
    if (!orderItemsSummary || !cart.length) return;
    
    let itemsHtml = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        itemsHtml += `
            <div class="order-item-summary">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">${item.quantity} × Tsh ${item.price.toLocaleString()}</div>
                </div>
                <div class="item-price">Tsh ${itemTotal.toLocaleString()}</div>
            </div>
        `;
    });
    
    orderItemsSummary.innerHTML = itemsHtml;
}

// Update price breakdown
function updatePriceBreakdown() {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    const tax = calculateTax();
    const total = calculateTotal();
    
    // Update price display
    const subtotalEl = document.getElementById('priceSubtotal');
    const deliveryEl = document.getElementById('priceDelivery');
    const taxEl = document.getElementById('priceTax');
    const totalEl = document.getElementById('priceTotal');
    
    if (subtotalEl) subtotalEl.textContent = `Tsh ${subtotal.toLocaleString()}`;
    if (deliveryEl) deliveryEl.textContent = `Tsh ${deliveryFee.toLocaleString()}`;
    if (taxEl) taxEl.textContent = `Tsh ${tax.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `Tsh ${total.toLocaleString()}`;
}

// Update estimated time
function updateEstimatedTime() {
    const estimatedTimeEl = document.getElementById('estimatedTime');
    if (!estimatedTimeEl) return;
    
    // Calculate estimated time based on order type and items
    let baseTime = 20; // 20 minutes base time
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const additionalTime = Math.floor(itemCount / 2) * 5; // 5 minutes for every 2 items
    
    let totalTime = baseTime + additionalTime;
    
    // Add time for delivery
    if (orderDetails?.orderType === 'delivery') {
        totalTime += 15; // 15 minutes for delivery
    }
    
    estimatedTimeEl.textContent = `${totalTime} dakika`;
}

// Select payment method
function selectPaymentMethod(method) {
    // Update UI
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.toggle('selected', el.dataset.method === method);
    });
    
    // Update radio button
    const radio = document.querySelector(`input[name="paymentMethod"][value="${method}"]`);
    if (radio) {
        radio.checked = true;
    }
    
    // Show/hide payment details
    const mpesaDetails = document.getElementById('mpesaDetails');
    const cardDetails = document.getElementById('cardDetails');
    
    if (mpesaDetails) {
        mpesaDetails.style.display = method === 'mpesa' ? 'block' : 'none';
    }
    
    if (cardDetails) {
        cardDetails.style.display = method === 'card' ? 'block' : 'none';
    }
    
    // Set required fields
    const mpesaNumber = document.getElementById('mpesaNumber');
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCVC = document.getElementById('cardCVC');
    
    if (mpesaNumber) mpesaNumber.required = method === 'mpesa';
    if (cardNumber) cardNumber.required = method === 'card';
    if (cardExpiry) cardExpiry.required = method === 'card';
    if (cardCVC) cardCVC.required = method === 'card';
}

// Submit order
async function submitOrder() {
    try {
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Show loading
        showLoading();
        
        // Get form data
        const formData = {
            customerName: document.getElementById('customerName').value.trim(),
            customerPhone: document.getElementById('customerPhone').value.trim(),
            customerEmail: document.getElementById('customerEmail')?.value.trim() || '',
            items: cart.map(item => ({
                itemId: item.itemId || item.id,
                quantity: item.quantity
            })),
            orderType: orderDetails?.orderType || 'takeaway',
            tableNumber: orderDetails?.tableNumber || null,
            deliveryAddress: orderDetails?.deliveryAddress || null,
            specialInstructions: document.getElementById('specialInstructions')?.value.trim() || '',
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value
        };
        
        // Add payment details
        const paymentMethod = formData.paymentMethod;
        if (paymentMethod === 'mpesa') {
            formData.mpesaNumber = document.getElementById('mpesaNumber').value.trim();
        } else if (paymentMethod === 'card') {
            formData.cardDetails = {
                number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expiry: document.getElementById('cardExpiry').value,
                cvc: document.getElementById('cardCVC').value
            };
        }
        
        // Send order to API
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Order created successfully
            showConfirmation(data.data);
            
            // Clear cart and order details
            localStorage.removeItem('cart');
            localStorage.removeItem('orderDetails');
            localStorage.removeItem('orderType');
            
        } else {
            // Handle API error
            showError(data.message || 'Hitilafu katika kutuma agizo. Tafadhali jaribu tena.');
        }
        
    } catch (error) {
        console.error('Error submitting order:', error);
        showError('Hitilafu ya mtandao. Tafadhali jaribu tena.');
        
        // Fallback: Simulate order creation
        simulateOrderConfirmation();
        
    } finally {
        hideLoading();
    }
}

// Validate form
function validateForm() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Basic validation
    if (!customerName) {
        showError('Tafadhali ingiza jina lako');
        return false;
    }
    
    if (!customerPhone || customerPhone.length !== 10) {
        showError('Tafadhali ingiza namba sahihi ya simu (10 tarakimu)');
        return false;
    }
    
    if (!acceptTerms) {
        showError('Tafadhali kubali masharti na masharti');
        return false;
    }
    
    // Payment method specific validation
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (paymentMethod === 'mpesa') {
        const mpesaNumber = document.getElementById('mpesaNumber').value.trim();
        if (!mpesaNumber || mpesaNumber.length !== 10) {
            showError('Tafadhali ingiza namba sahihi ya M-Pesa (10 tarakimu)');
            return false;
        }
    }
    
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('cardExpiry').value;
        const cardCVC = document.getElementById('cardCVC').value;
        
        if (!cardNumber || cardNumber.length < 16) {
            showError('Tafadhali ingiza namba sahihi ya kadi (16 tarakimu)');
            return false;
        }
        
        if (!cardExpiry || !cardExpiry.match(/^\d{2}\/\d{2}$/)) {
            showError('Tafadhali ingiza tarehe sahihi ya mwisho (MM/YY)');
            return false;
        }
        
        if (!cardCVC || cardCVC.length !== 3) {
            showError('Tafadhali ingiza namba sahihi ya CVC (3 tarakimu)');
            return false;
        }
    }
    
    return true;
}

// Show confirmation modal
function showConfirmation(order) {
    // Update modal content
    document.getElementById('modalOrderNumber').textContent = order.orderNumber;
    document.getElementById('modalCustomerName').textContent = order.customerName;
    document.getElementById('modalOrderDate').textContent = new Date(order.createdAt).toLocaleDateString('sw-TZ');
    document.getElementById('modalOrderTotal').textContent = `Tsh ${order.totalAmount.toLocaleString()}`;
    document.getElementById('modalEstimatedTime').textContent = `${order.estimatedTime} dakika`;
    
    // Show modal
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'flex';
    
    // Update confirmation message
    const message = document.getElementById('confirmationMessage');
    if (order.orderType === 'dine-in') {
        message.textContent = `Asante ${order.customerName}! Agizo lako limepokelewa. Tafadhali wasili kwenye meza ${order.tableNumber} ndani ya dakika ${order.estimatedTime}.`;
    } else if (order.orderType === 'delivery') {
        message.textContent = `Asante ${order.customerName}! Agizo lako limepokelewa. Chakula kitakufikishwa kwenye anwani yako ndani ya dakika ${order.estimatedTime}.`;
    } else {
        message.textContent = `Asante ${order.customerName}! Agizo lako limepokelewa. Tafadhali lichukue ndani ya dakika ${order.estimatedTime}.`;
    }
}

// Simulate order confirmation (fallback)
function simulateOrderConfirmation() {
    const orderNumber = 'ORD' + Date.now().toString().slice(-6);
    const customerName = document.getElementById('customerName').value.trim();
    const orderType = orderDetails?.orderType || 'takeaway';
    const tableNumber = orderDetails?.tableNumber;
    
    // Update modal content
    document.getElementById('modalOrderNumber').textContent = orderNumber;
    document.getElementById('modalCustomerName').textContent = customerName;
    document.getElementById('modalOrderDate').textContent = new Date().toLocaleDateString('sw-TZ');
    document.getElementById('modalOrderTotal').textContent = `Tsh ${calculateTotal().toLocaleString()}`;
    document.getElementById('modalEstimatedTime').textContent = '30 dakika';
    
    // Show modal
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'flex';
    
    // Update confirmation message
    const message = document.getElementById('confirmationMessage');
    if (orderType === 'dine-in' && tableNumber) {
        message.textContent = `Asante ${customerName}! Agizo lako limepokelewa (Namba: ${orderNumber}). Tafadhali wasili kwenye meza ${tableNumber} ndani ya dakika 30.`;
    } else if (orderType === 'delivery') {
        message.textContent = `Asante ${customerName}! Agizo lako limepokelewa (Namba: ${orderNumber}). Chakula kitakufikishwa ndani ya dakika 30.`;
    } else {
        message.textContent = `Asante ${customerName}! Agizo lako limepokelewa (Namba: ${orderNumber}). Tafadhali lichukue ndani ya dakika 30.`;
    }
    
    // Clear cart and order details
    localStorage.removeItem('cart');
    localStorage.removeItem('orderDetails');
    localStorage.removeItem('orderType');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Print receipt
function printReceipt() {
    const orderNumber = document.getElementById('modalOrderNumber').textContent;
    const customerName = document.getElementById('modalCustomerName').textContent;
    const orderDate = document.getElementById('modalOrderDate').textContent;
    const orderTotal = document.getElementById('modalOrderTotal').textContent;
    
    const printContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 400px;">
            <h2 style="text-align: center; color: #f59e0b;">🍽️ Delicious Restaurant</h2>
            <h3 style="text-align: center;">Risiti ya Agizo</h3>
            <hr style="margin: 20px 0;">
            
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 5px 0;"><strong>Namba ya Agizo:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${orderNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Mteja:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${customerName}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Tarehe:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${orderDate}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Muda:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${new Date().toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
            </table>
            
            <hr style="margin: 20px 0;">
            
            <h4 style="margin-bottom: 10px;">Vyakula:</h4>
            ${cart.map(item => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${item.name} (${item.quantity})</span>
                    <span>Tsh ${(item.price * item.quantity).toLocaleString()}</span>
                </div>
            `).join('')}
            
            <hr style="margin: 20px 0;">
            
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 5px 0;"><strong>Jumla:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">${orderTotal}</td>
                </tr>
            </table>
            
            <hr style="margin: 20px 0;">
            
            <p style="text-align: center; font-size: 12px; color: #666;">
                Asante kwa kununua kutoka kwetu!<br>
                Karibu tena.<br>
                Simu: 0712 345 678
            </p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Track order
function trackOrder() {
    const orderNumber = document.getElementById('modalOrderNumber').textContent;
    alert(`Utakuwa na uwezo wa kufuata agizo ${orderNumber} kwenye ukurasa wetu wa kufuatilia. (Huduma itaanza hivi karibuni)`);
}

// Go back to cart
function goBackToCart() {
    window.location.href = 'cart.html';
}

// Show terms
function showTerms() {
    alert(`
        MASHARTI NA MASHARTI YA DELICIOUS RESTAURANT
        
        1. Agizo lolote lililowekwa linahitaji malipo.
        2. Tuna haki ya kukataa agizo lolote lisilokidhi vigezo vyetu.
        3. Bei zinaweza kubadilika bila taarifa.
        4. Marejesho yanakubaliwa ndani ya saa 1 baada ya kupokea chakula.
        5. Tunachukua jukumu la usalama wa chakula.
        6. Wateja wanashauriwa kutoa maelezo sahihi.
        
        Kwa maswali zaidi, wasiliana nasi: 0712 345 678
    `);
}

// Show loading
function showLoading() {
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Inatumwa...</p>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
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

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Make functions globally available
window.selectPaymentMethod = selectPaymentMethod;
window.closeModal = closeModal;
window.printReceipt = printReceipt;
window.trackOrder = trackOrder;
window.goBackToCart = goBackToCart;
window.showTerms = showTerms;
window.toggleMenu = toggleMenu;
