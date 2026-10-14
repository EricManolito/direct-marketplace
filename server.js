const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Parse JSON request bodies (needed for POST /api/orders in step 2)
app.use(express.json());

// Serve the frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Direct Marketplace running at http://localhost:${PORT}`);
});