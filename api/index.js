const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory database
let menuItems = [
    {
        id: 1,
        name: "Chicken Biryani",
        description: "Fragrant basmati rice cooked with tender chicken, spices, and herbs",
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
        description: "Classic pizza with tomato sauce, mozzarella, and fresh basil",
        price: 2200,
        category: "Italian",
        image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: true,
        rating: 4.6
    },
    {
        id: 3,
        name: "Beef Burger",
        description: "Juicy beef patty with cheese, lettuce, tomato, and special sauce",
        price: 1500,
        category: "Fast Food",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: false,
        rating: 4.5
    },
    {
        id: 4,
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan",
        price: 1200,
        category: "Salads",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: true,
        rating: 4.3
    },
    {
        id: 5,
        name: "Chocolate Brownie",
        description: "Warm chocolate brownie with vanilla ice cream and chocolate sauce",
        price: 800,
        category: "Desserts",
        image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: true,
        rating: 4.7
    },
    {
        id: 6,
        name: "Grilled Chicken",
        description: "Tender chicken breast grilled to perfection with herbs and spices",
        price: 2000,
        category: "Grills",
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: false,
        rating: 4.4
    },
    {
        id: 7,
        name: "Vegetable Pasta",
        description: "Pasta with fresh vegetables in creamy tomato sauce",
        price: 1600,
        category: "Italian",
        image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: true,
        rating: 4.2
    },
    {
        id: 8,
        name: "Mango Lassi",
        description: "Refreshing yogurt-based drink with mango pulp",
        price: 500,
        category: "Drinks",
        image: "https://images.unsplash.com/photo-1628992682633-bf2d40cb595f?w=400&h=300&fit=crop",
        available: true,
        spicy: false,
        vegetarian: true,
        rating: 4.6
    }
];

let orders = [];
let users = [];
let tables = [
    { id: 1, number: "T01", seats: 2, available: true },
    { id: 2, number: "T02", seats: 4, available: true },
    { id: 3, number: "T03", seats: 6, available: true },
    { id: 4, number: "T04", seats: 2, available: true },
    { id: 5, number: "T05", seats: 4, available: true }
];

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Restaurant Ordering System',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        menuItems: menuItems.length,
        orders: orders.length
    });
});

// Get all menu items
app.get('/api/menu', (req, res) => {
    const { category, vegetarian, available } = req.query;
    
    let filteredMenu = [...menuItems];
    
    if (category) {
        filteredMenu = filteredMenu.filter(item => item.category === category);
    }
    
    if (vegetarian === 'true') {
        filteredMenu = filteredMenu.filter(item => item.vegetarian === true);
    }
    
    if (available === 'true') {
        filteredMenu = filteredMenu.filter(item => item.available === true);
    }
    
    res.json({
        success: true,
        count: filteredMenu.length,
        data: filteredMenu
    });
});

// Get single menu item
app.get('/api/menu/:id', (req, res) => {
    const item = menuItems.find(m => m.id === parseInt(req.params.id));
    if (!item) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
});

// Get menu categories
app.get('/api/menu/categories', (req, res) => {
    const categories = [...new Set(menuItems.map(item => item.category))];
    res.json({ success: true, data: categories });
});

// Create new order
app.post('/api/orders', (req, res) => {
    try {
        const { customerName, customerPhone, customerEmail, items, tableNumber, deliveryAddress, orderType, specialInstructions } = req.body;
        
        // Validation
        if (!customerName || !customerPhone || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer name, phone, and at least one item are required'
            });
        }
        
        // Validate items
        let totalAmount = 0;
        for (const orderItem of items) {
            const menuItem = menuItems.find(m => m.id === orderItem.itemId);
            if (!menuItem) {
                return res.status(400).json({
                    success: false,
                    message: `Menu item with ID ${orderItem.itemId} not found`
                });
            }
            if (!menuItem.available) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is not available`
                });
            }
            totalAmount += menuItem.price * orderItem.quantity;
        }
        
        // Create order
        const order = {
            id: uuidv4(),
            orderNumber: 'ORD' + Date.now().toString().slice(-6),
            customerName,
            customerPhone,
            customerEmail: customerEmail || '',
            items: items.map(item => {
                const menuItem = menuItems.find(m => m.id === item.itemId);
                return {
                    itemId: item.itemId,
                    name: menuItem.name,
                    quantity: item.quantity,
                    price: menuItem.price,
                    total: menuItem.price * item.quantity
                };
            }),
            totalAmount,
            orderType: orderType || 'dine-in', // 'dine-in', 'takeaway', 'delivery'
            tableNumber: orderType === 'dine-in' ? tableNumber : null,
            deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
            specialInstructions: specialInstructions || '',
            status: 'pending', // 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedTime: 30, // minutes
            paymentStatus: 'pending' // 'pending', 'paid', 'refunded'
        };
        
        // If dine-in, mark table as occupied
        if (orderType === 'dine-in' && tableNumber) {
            const table = tables.find(t => t.number === tableNumber);
            if (table) {
                table.available = false;
            }
        }
        
        orders.push(order);
        
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get all orders
app.get('/api/orders', (req, res) => {
    const { status, phone } = req.query;
    
    let filteredOrders = [...orders];
    
    if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (phone) {
        filteredOrders = filteredOrders.filter(order => order.customerPhone.includes(phone));
    }
    
    // Sort by latest first
    filteredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
        success: true,
        count: filteredOrders.length,
        data: filteredOrders
    });
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
});

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
    }
    
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    // If order is completed or cancelled and was dine-in, free the table
    if ((status === 'completed' || status === 'cancelled') && orders[orderIndex].tableNumber) {
        const table = tables.find(t => t.number === orders[orderIndex].tableNumber);
        if (table) {
            table.available = true;
        }
    }
    
    res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: orders[orderIndex]
    });
});

// Update payment status
app.patch('/api/orders/:id/payment', (req, res) => {
    const { paymentStatus } = req.body;
    const validPaymentStatuses = ['pending', 'paid', 'refunded'];
    
    if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
            success: false,
            message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`
        });
    }
    
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    orders[orderIndex].paymentStatus = paymentStatus;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        message: `Payment status updated to ${paymentStatus}`,
        data: orders[orderIndex]
    });
});

// Get available tables
app.get('/api/tables', (req, res) => {
    const { seats } = req.query;
    
    let availableTables = tables.filter(table => table.available);
    
    if (seats) {
        availableTables = availableTables.filter(table => table.seats >= parseInt(seats));
    }
    
    res.json({
        success: true,
        count: availableTables.length,
        data: availableTables
    });
});

// Reserve table
app.post('/api/tables/reserve', (req, res) => {
    const { tableNumber } = req.body;
    
    const table = tables.find(t => t.number === tableNumber);
    if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
    }
    
    if (!table.available) {
        return res.status(400).json({ success: false, message: 'Table is already occupied' });
    }
    
    table.available = false;
    
    res.json({
        success: true,
        message: `Table ${tableNumber} reserved successfully`,
        data: table
    });
});

// Free table
app.post('/api/tables/free', (req, res) => {
    const { tableNumber } = req.body;
    
    const table = tables.find(t => t.number === tableNumber);
    if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
    }
    
    table.available = true;
    
    res.json({
        success: true,
        message: `Table ${tableNumber} freed successfully`,
        data: table
    });
});

// Get order statistics
app.get('/api/stats', (req, res) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        preparingOrders: orders.filter(o => o.status === 'preparing').length,
        readyOrders: orders.filter(o => o.status === 'ready').length,
        todayOrders: orders.filter(o => o.createdAt.startsWith(today)).length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        averageOrderValue: orders.length > 0 ? 
            orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
        popularCategories: getPopularCategories(),
        availableTables: tables.filter(t => t.available).length,
        totalTables: tables.length
    };
    
    res.json({ success: true, data: stats });
});

function getPopularCategories() {
    const categoryCount = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            const menuItem = menuItems.find(m => m.id === item.itemId);
            if (menuItem) {
                categoryCount[menuItem.category] = (categoryCount[menuItem.category] || 0) + item.quantity;
            }
        });
    });
    
    return Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));
}

// User registration
app.post('/api/users/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, phone, and password are required'
        });
    }
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email || u.phone === phone);
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: 'User with this email or phone already exists'
        });
    }
    
    const user = {
        id: uuidv4(),
        name,
        email,
        phone,
        password: Buffer.from(password).toString('base64'), // Simple encoding
        createdAt: new Date().toISOString(),
        role: 'customer'
    };
    
    users.push(user);
    
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: userWithoutPassword
    });
});

// User login
app.post('/api/users/login', (req, res) => {
    const { email, phone, password } = req.body;
    
    if ((!email && !phone) || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email/phone and password are required'
        });
    }
    
    const user = users.find(u => 
        (email && u.email === email) || (phone && u.phone === phone)
    );
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
    
    const encodedPassword = Buffer.from(password).toString('base64');
    if (user.password !== encodedPassword) {
        return res.status(401).json({
            success: false,
            message: 'Invalid password'
        });
    }
    
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
        success: true,
        message: 'Login successful',
        data: userWithoutPassword
    });
});

// Get user orders
app.get('/api/users/:userId/orders', (req, res) => {
    const { userId } = req.params;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userOrders = orders.filter(o => 
        o.customerPhone === user.phone || o.customerEmail === user.email
    );
    
    res.json({
        success: true,
        count: userOrders.length,
        data: userOrders
    });
});

// Search menu items
app.get('/api/menu/search/:query', (req, res) => {
    const query = req.params.query.toLowerCase();
    
    const results = menuItems.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

// Admin: Add menu item
app.post('/api/admin/menu', (req, res) => {
    const { name, description, price, category, image, available, vegetarian, spicy } = req.body;
    
    if (!name || !price || !category) {
        return res.status(400).json({
            success: false,
            message: 'Name, price, and category are required'
        });
    }
    
    const newItem = {
        id: menuItems.length > 0 ? Math.max(...menuItems.map(m => m.id)) + 1 : 1,
        name,
        description: description || '',
        price: parseFloat(price),
        category,
        image: image || 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop',
        available: available !== undefined ? available : true,
        vegetarian: vegetarian || false,
        spicy: spicy || false,
        rating: 4.0,
        createdAt: new Date().toISOString()
    };
    
    menuItems.push(newItem);
    
    res.status(201).json({
        success: true,
        message: 'Menu item added successfully',
        data: newItem
    });
});

// Admin: Update menu item
app.put('/api/admin/menu/:id', (req, res) => {
    const itemIndex = menuItems.findIndex(m => m.id === parseInt(req.params.id));
    
    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    
    const updatedItem = { ...menuItems[itemIndex], ...req.body, updatedAt: new Date().toISOString() };
    menuItems[itemIndex] = updatedItem;
    
    res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: updatedItem
    });
});

// Admin: Delete menu item
app.delete('/api/admin/menu/:id', (req, res) => {
    const itemIndex = menuItems.findIndex(m => m.id === parseInt(req.params.id));
    
    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    
    // Check if item is in any active orders
    const activeOrders = orders.filter(order => 
        order.status !== 'completed' && order.status !== 'cancelled'
    );
    
    const itemInOrders = activeOrders.some(order =>
        order.items.some(item => item.itemId === parseInt(req.params.id))
    );
    
    if (itemInOrders) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete menu item that is in active orders'
        });
    }
    
    const deletedItem = menuItems.splice(itemIndex, 1)[0];
    
    res.json({
        success: true,
        message: 'Menu item deleted successfully',
        data: deletedItem
    });
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/menu.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/checkout.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🍽️ Restaurant Ordering System running on port ${PORT}`);
        console.log(`🌐 Open: http://localhost:${PORT}`);
        console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;
