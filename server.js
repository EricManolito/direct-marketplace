const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

// --- Database setup ---
// Creates marketplace.db in the project root the first time it runs
const db = new Database(path.join(__dirname, 'marketplace.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    total      REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL,
    name       TEXT NOT NULL,
    price      REAL NOT NULL,
    qty        INTEGER NOT NULL
  );
`);

const insertOrder = db.prepare('INSERT INTO orders (total) VALUES (?)');
const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)'
);

// Everything inside runs as one transaction: all rows save, or none do
const placeOrder = db.transaction((items, total) => {
    const orderId = insertOrder.run(total).lastInsertRowid;
    for (const item of items) {
        insertItem.run(orderId, String(item.id), item.name, item.price, item.qty);
    }
    return orderId;
});

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
app.post('/api/orders', (req, res) => {
    const items = req.body.items;

    // Reject anything that isn't a non-empty list of well-formed items
    const valid =
        Array.isArray(items) &&
        items.length > 0 &&
        items.every(
            (i) =>
                i.id !== undefined &&
                typeof i.name === 'string' &&
                typeof i.price === 'number' && i.price >= 0 &&
                Number.isInteger(i.qty) && i.qty > 0
        );

    if (!valid) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

    try {
        const orderId = placeOrder(items, total);
        res.status(201).json({ orderId: Number(orderId), total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not save order' });
    }
});

// Handy for checking what's been saved
app.get('/api/orders', (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    for (const order of orders) {
        order.items = getItems.all(order.id);
    }
    res.json(orders);
});

app.listen(PORT, () => {
    console.log(`Direct Marketplace running at http://localhost:${PORT}`);
});