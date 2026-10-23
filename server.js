const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const products = require('./products.json');

const app = express();
const PORT = 3000;

// --- Database setup ---
// Creates marketplace.db in the project root the first time it runs
const db = new Database(path.join(__dirname, 'marketplace.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    artist       TEXT NOT NULL,
    price        REAL NOT NULL,
    dealer_price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name  TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    total          REAL NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL REFERENCES products(id),
    name       TEXT NOT NULL,
    price      REAL NOT NULL,
    qty        INTEGER NOT NULL
  );
`);

// --- Load products.json into the products table on every startup ---
// Edit products.json and restart the server to change names or prices.
// order_items keeps its own copy of name and price, so past orders
// still show what the customer actually paid.
const upsertProduct = db.prepare(`
  INSERT INTO products (id, name, category, artist, price, dealer_price)
  VALUES (@id, @name, @category, @artist, @price, @dealerPrice)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    artist = excluded.artist,
    price = excluded.price,
    dealer_price = excluded.dealer_price
`);
db.transaction((list) => {
  for (const p of list) upsertProduct.run(p);
})(products);

const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
const insertOrder = db.prepare(
  'INSERT INTO orders (customer_name, customer_email, total) VALUES (?, ?, ?)'
);
const insertItem = db.prepare(
  'INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)'
);

// Everything inside runs as one transaction: all rows save, or none do
const placeOrder = db.transaction((customer, lines, total) => {
  const orderId = insertOrder.run(customer.name, customer.email, total).lastInsertRowid;
  for (const { product, qty } of lines) {
    insertItem.run(orderId, product.id, product.name, product.price, qty);
  }
  return orderId;
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
app.post('/api/orders', (req, res) => {
  const { items, customer } = req.body ?? {};

  // Customer info
  const name = typeof customer?.name === 'string' ? customer.name.trim() : '';
  const email = typeof customer?.email === 'string' ? customer.email.trim() : '';

  if (!name || name.length > 100) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Items: the browser sends only id and qty. Prices come from our own table.
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const lines = [];
  for (const item of items) {
    if (!Number.isInteger(item?.qty) || item.qty < 1 || item.qty > 99) {
      return res.status(400).json({ error: 'Invalid quantity in cart.' });
    }
    const product = getProduct.get(String(item.id));
    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${item.id}` });
    }
    lines.push({ product, qty: item.qty });
  }

  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  try {
    const orderId = placeOrder({ name, email }, lines, total);
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
