// HERO SLIDESHOW
const slides = document.querySelectorAll('.hero-slider .slide');
let currentSlide = 0;

if (slides.length > 0) {
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000); // changes every 4 seconds
}
// ===== HERO SLIDER =====
function initHeroSlider(slider, interval = 4000) {
    const slides = slider.querySelectorAll('.slide');
    if (slides.length < 2) return; // nothing to cycle

    // Start on whichever slide has .active in the HTML (or the first one)
    let current = [...slides].findIndex(s => s.classList.contains('active'));
    if (current === -1) {
        current = 0;
        slides[0].classList.add('active');
    }

    // --- Dots (one per slide) ---
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'slider-dots';
    const dots = [...slides].map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot';
        dot.setAttribute('aria-label', `Show slide ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); restart(); });
        dotsWrap.appendChild(dot);
        return dot;
    });
    dots[current].classList.add('active');

    // --- Arrows ---
    const prev = makeArrow('prev', '‹', 'Previous slide', () => { goTo(current - 1); restart(); });
    const next = makeArrow('next', '›', 'Next slide', () => { goTo(current + 1); restart(); });
    slider.append(prev, next, dotsWrap);

    function goTo(i) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (i + slides.length) % slides.length; // wraps both directions
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    // --- Auto-play with pause ---
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = null;
    let paused = false;

    function start() {
        if (reduceMotion || paused || timer) return;
        timer = setInterval(() => goTo(current + 1), interval);
    }
    function stop() {
        clearInterval(timer);
        timer = null;
    }
    function restart() { stop(); start(); }

    // Pause while the mouse is over it or a control has keyboard focus
    slider.addEventListener('mouseenter', () => { paused = true; stop(); });
    slider.addEventListener('mouseleave', () => { paused = false; start(); });
    slider.addEventListener('focusin', () => { paused = true; stop(); });
    slider.addEventListener('focusout', () => { paused = false; start(); });

    // Pause when the browser tab is hidden
    document.addEventListener('visibilitychange', () => {
        document.hidden ? stop() : start();
    });

    start();
}

function makeArrow(direction, symbol, label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `slider-arrow slider-arrow--${direction}`;
    btn.setAttribute('aria-label', label);
    btn.textContent = symbol;
    btn.addEventListener('click', onClick);
    return btn;
}

document.querySelectorAll('.hero-slider').forEach(slider => initHeroSlider(slider));

// ===== ARTIST OVERLAY =====
// Placeholder data. Later this comes from the backend (GET /api/artists/:id).
// Grouped by category so artist-1 on jewelry.html and artist-1 on pottery.html don't collide.
// Colors stay here because they're styling. Everything else comes from the server.
const CATEGORY_COLORS = {
    jewelry: ['0a1a2f', '4da6ff'],
    pottery: ['3a2410', 'ffb000'],
    rugs: ['1e2b1a', '9acd32']
};

// Fetches the catalog once per page and shares it with everything that asks
let catalogPromise = null;
function loadCatalog() {
    if (!catalogPromise) {
        catalogPromise = fetch('/api/catalog').then(res => {
            if (!res.ok) throw new Error(`Server responded ${res.status}`);
            return res.json();
        });
    }
    return catalogPromise;
}

const pageCategory = ['jewelry', 'pottery', 'rugs']
    .find(c => document.body.classList.contains(`theme-${c}`));
const artistOverlay = document.getElementById('artist-overlay');

if (pageCategory && artistOverlay) initArtistOverlay();

async function initArtistOverlay() {
    const colors = CATEGORY_COLORS[pageCategory];
    let artists = {};
    try {
        artists = (await loadCatalog()).categories[pageCategory].artists;
    } catch (err) {
        console.error('Could not load catalog:', err);
    }
    const closeBtn = document.getElementById('overlay-close');
    const content = artistOverlay.querySelector('.overlay-content');
    let lastRow = null;

    // Accessibility: announce as a dialog
    artistOverlay.setAttribute('role', 'dialog');
    artistOverlay.setAttribute('aria-modal', 'true');
    artistOverlay.setAttribute('aria-labelledby', 'overlay-artist-name');
    closeBtn.setAttribute('aria-label', 'Close artist details');

    // Make each artist row clickable and keyboard-usable
    document.querySelectorAll('.artist-row').forEach(row => {
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.addEventListener('click', () => openOverlay(row));
        row.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openOverlay(row);
            }
        });
    });

    // Three ways to close: × button, clicking the dark backdrop, Escape key
    closeBtn.addEventListener('click', closeOverlay);
    artistOverlay.addEventListener('click', e => {
        if (e.target === artistOverlay) closeOverlay();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && artistOverlay.classList.contains('active')) closeOverlay();
    });

    function openOverlay(row) {
        const artist = artists[row.dataset.artistId];
        if (!artist) {
            console.warn('No artist data for', row.dataset.artistId);
            return;
        }
        lastRow = row;

        // Reuse the row's thumbnail for the overlay portrait
        const rowImg = row.querySelector('img');
        const img = document.getElementById('overlay-artist-img');
        img.src = rowImg ? rowImg.src : '';
        img.alt = artist.name;

        document.getElementById('overlay-artist-name').textContent = artist.name;
        document.getElementById('overlay-artist-bio').textContent = artist.bio;
        document.getElementById('overlay-products')
            .replaceChildren(...artist.products.map(p => buildProductCard(p, colors)));

        content.scrollTop = 0;
        artistOverlay.classList.add('active');
        document.body.classList.add('overlay-open'); // stops the page behind from scrolling
        closeBtn.focus();
    }

    function closeOverlay() {
        artistOverlay.classList.remove('active');
        document.body.classList.remove('overlay-open');
        if (lastRow) lastRow.focus(); // return keyboard focus where it was
    }
}

function buildProductCard(product, [bg, fg]) {
    const card = document.createElement('div');
    card.className = 'product-card card';

    const img = document.createElement('img');
    img.src = `https://placehold.co/400x300/${bg}/${fg}?text=${product.name.replace(/ /g, '+')}`;
    img.alt = product.name;

    const title = document.createElement('h3');
    title.textContent = product.name;

    // Ledger: artist price vs. struck-through dealer price
    const ledger = document.createElement('div');
    ledger.className = 'ledger';

    const artistPrice = document.createElement('span');
    artistPrice.className = 'ledger-artist';
    artistPrice.textContent = formatPrice(product.price);

    const dealerPrice = document.createElement('span');
    dealerPrice.className = 'ledger-dealer';
    dealerPrice.textContent = formatPrice(product.dealerPrice);
    dealerPrice.setAttribute('aria-label', `Typical dealer price ${formatPrice(product.dealerPrice)}`);

    ledger.append(artistPrice, dealerPrice);

    const savings = document.createElement('p');
    savings.className = 'ledger-note';
    savings.textContent = `${formatPrice(product.dealerPrice - product.price)} in markup goes back to the artist`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add-to-cart';
    btn.dataset.productId = product.id;
    btn.textContent = 'Add to Cart';
    btn.addEventListener('click', () => {
        addToCart(product, img.src);
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1500);
    });

    card.append(img, title, ledger, savings, btn);
    return card;
}

function formatPrice(n) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// ===== CART (localStorage) =====
const CART_KEY = 'dm-cart';

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return []; // corrupted data shouldn't break the site
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, image) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            dealerPrice: product.dealerPrice,
            image,
            qty: 1
        });
    }
    saveCart(cart);
}

function changeQty(id, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    renderCart();
}

function removeFromCart(id) {
    saveCart(getCart().filter(i => i.id !== id));
    renderCart();
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = getCart().reduce((sum, i) => sum + i.qty, 0);
}

// ===== CART PAGE =====
function renderCart() {
    const list = document.getElementById('cart-items');
    if (!list) return; // not on cart.html

    const cart = getCart();
    list.replaceChildren(...cart.map(buildCartRow));

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const dealerTotal = cart.reduce((s, i) => s + i.dealerPrice * i.qty, 0);

    document.getElementById('cart-empty-msg').hidden = cart.length > 0;
    document.getElementById('cart-total').textContent = formatPrice(total);
    document.getElementById('checkout-btn').disabled = cart.length === 0;

    const savings = document.getElementById('cart-savings');
    if (savings) {
        savings.textContent = cart.length
            ? `At dealer prices this would be ${formatPrice(dealerTotal)}. ${formatPrice(dealerTotal - total)} stays with the artists.`
            : '';
    }
}

function buildCartRow(item) {
    const row = document.createElement('div');
    row.className = 'cart-row card';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;

    const name = document.createElement('span');
    name.className = 'cart-name';
    name.textContent = item.name;

    const qty = document.createElement('div');
    qty.className = 'cart-qty';
    const count = document.createElement('span');
    count.textContent = item.qty;
    qty.append(
        makeButton('−', `Decrease quantity of ${item.name}`, () => changeQty(item.id, -1)),
        count,
        makeButton('+', `Increase quantity of ${item.name}`, () => changeQty(item.id, 1))
    );

    const lineTotal = document.createElement('span');
    lineTotal.className = 'cart-line-total';
    lineTotal.textContent = formatPrice(item.price * item.qty);

    const remove = makeButton('Remove', `Remove ${item.name} from cart`, () => removeFromCart(item.id));
    remove.classList.add('cart-remove');

    row.append(img, name, qty, lineTotal, remove);
    return row;
}

function makeButton(text, label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = text;
    btn.setAttribute('aria-label', label);
    btn.addEventListener('click', onClick);
    return btn;
}

function initCheckout() {
    const btn = document.getElementById('checkout-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const msg = document.getElementById('cart-empty-msg');
        const nameInput = document.getElementById('customer-name');
        const emailInput = document.getElementById('customer-email');

        // Let the browser show its own "please fill this in" bubbles first
        if (!nameInput.reportValidity() || !emailInput.reportValidity()) return;

        const customer = { name: nameInput.value.trim(), email: emailInput.value.trim() };

        // Only ids and quantities. The server sets the prices.
        const items = getCart().map(({ id, qty }) => ({ id, qty }));

        btn.disabled = true;
        btn.textContent = 'Placing order…';

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer, items })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const err = new Error(`Server responded ${res.status}`);
                err.serverMessage = data.error;
                throw err;
            }

            const order = await res.json();

            localStorage.removeItem(CART_KEY);
            updateCartCount();
            renderCart();
            nameInput.value = '';
            emailInput.value = '';
            msg.textContent =
                `Thank you, ${customer.name}! Order #${order.orderId} placed — ${formatPrice(order.total)} goes to the artists (demo — no payment taken).`;
        } catch (err) {
            console.error(err);
            btn.disabled = false;
            alert(err.serverMessage ||
                'Sorry, your order could not be placed. Your cart has been kept. Please try again.');
        } finally {
            btn.textContent = 'Checkout';
        }
    });
}

// ===== FEATURED PRODUCT (home page) =====
function initFeaturedProduct() {
    const section = document.querySelector('.featured-product');
    const btn = section?.querySelector('.add-to-cart');
    if (!btn) return; // not on the home page

    btn.disabled = true; // wait until we know the real price

    loadCatalog()
        .then(({ featured }) => {
            const priceEl = document.getElementById('featured-price');
            if (priceEl) priceEl.textContent = formatPrice(featured.price);

            btn.disabled = false;
            btn.addEventListener('click', () => {
                const img = section.querySelector('img');
                addToCart(featured, img ? img.src : '');
                btn.textContent = 'Added ✓';
                setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1500);
            });
        })
        .catch(err => console.error('Could not load featured product:', err));
}
// ===== INIT =====
updateCartCount();
renderCart();
initCheckout();
initFeaturedProduct();

// Keep the count in sync if the cart changes in another tab
window.addEventListener('storage', e => {
    if (e.key === CART_KEY) {
        updateCartCount();
        renderCart();
    }
});