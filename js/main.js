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
const artistData = {
    jewelry: {
        colors: ['0a1a2f', '4da6ff'],
        artists: {
            'artist-1': {
                name: 'Maria Tsosie',
                bio: 'Placeholder bio. Silversmith working in hand-stamped sterling and natural turquoise.',
                products: [
                    { id: 'jw-101', name: 'Turquoise Cuff', price: 420, dealerPrice: 1150 },
                    { id: 'jw-102', name: 'Squash Blossom Pendant', price: 680, dealerPrice: 1800 }
                ]
            },
            'artist-2': {
                name: 'Jonah Begay',
                bio: 'Placeholder bio. Known for heavy-gauge stamped silver bracelets.',
                products: [
                    { id: 'jw-201', name: 'Stamped Silver Bracelet', price: 260, dealerPrice: 700 },
                    { id: 'jw-202', name: 'Coral Ring', price: 180, dealerPrice: 475 }
                ]
            },
            'artist-3': {
                name: 'Waddie Crazyhorse',
                bio: 'Placeholder bio. Inlay and needlepoint work in stone and shell.',
                products: [
                    { id: 'jw-301', name: 'Inlay Bolo Tie', price: 540, dealerPrice: 1400 },
                    { id: 'jw-302', name: 'Needlepoint Earrings', price: 150, dealerPrice: 395 }
                ]
            },
            'artist-4': {
                name: 'Catthew Analla',
                bio: 'Placeholder bio. Beadwork and concho pieces with spiny oyster accents.',
                products: [
                    { id: 'jw-401', name: 'Spiny Oyster Necklace', price: 390, dealerPrice: 980 },
                    { id: 'jw-402', name: 'Silver Concho Belt', price: 1200, dealerPrice: 3200 }
                ]
            }
        }
    },
    pottery: {
        colors: ['3a2410', 'ffb000'],
        artists: {
            'artist-1': {
                name: 'Maddie Deshnod',
                bio: 'Placeholder bio. Hand-coiled blackware, burnished and pit-fired.',
                products: [
                    { id: 'pt-101', name: 'Black-on-Black Bowl', price: 450, dealerPrice: 1200 },
                    { id: 'pt-102', name: 'Seed Pot', price: 140, dealerPrice: 380 }
                ]
            },
            'artist-2': {
                name: 'Abe Potts',
                bio: 'Placeholder bio. Polychrome ollas painted with natural mineral pigments.',
                products: [
                    { id: 'pt-201', name: 'Polychrome Olla', price: 820, dealerPrice: 2100 },
                    { id: 'pt-202', name: 'Micaceous Bean Pot', price: 300, dealerPrice: 790 }
                ]
            },
            'artist-3': {
                name: 'Samantha Tillwater',
                bio: 'Placeholder bio. Etched vessels and storyteller figures.',
                products: [
                    { id: 'pt-301', name: 'Etched Wedding Vase', price: 360, dealerPrice: 950 },
                    { id: 'pt-302', name: 'Storyteller Figure', price: 280, dealerPrice: 740 }
                ]
            },
            'artist-4': {
                name: 'Edgar Shallow',
                bio: 'Placeholder bio. Carved sgraffito jars and melon bowls.',
                products: [
                    { id: 'pt-401', name: 'Sgraffito Jar', price: 520, dealerPrice: 1350 },
                    { id: 'pt-402', name: 'Melon Bowl', price: 230, dealerPrice: 610 }
                ]
            }
        }
    },
    rugs: {
        colors: ['1e2b1a', '9acd32'],
        artists: {
            'artist-1': {
                name: 'Mary Manuelito',
                bio: 'Placeholder bio. Two Grey Hills weaver using undyed, hand-carded wool.',
                products: [
                    { id: 'rg-101', name: 'Two Grey Hills Rug', price: 2400, dealerPrice: 6500 },
                    { id: 'rg-102', name: 'Small Tapestry Weaving', price: 650, dealerPrice: 1700 }
                ]
            },
            'artist-2': {
                name: 'Leona Barbone',
                bio: 'Placeholder bio. Ganado Red rugs and saddle blankets.',
                products: [
                    { id: 'rg-201', name: 'Ganado Red Rug', price: 1800, dealerPrice: 4800 },
                    { id: 'rg-202', name: 'Saddle Blanket', price: 480, dealerPrice: 1250 }
                ]
            },
            'artist-3': {
                name: 'Alice Tsosie',
                bio: 'Placeholder bio. Storm pattern and chief blanket revival weavings.',
                products: [
                    { id: 'rg-301', name: 'Storm Pattern Rug', price: 1500, dealerPrice: 4000 },
                    { id: 'rg-302', name: 'Chief Blanket Revival', price: 2100, dealerPrice: 5600 }
                ]
            },
            'artist-4': {
                name: 'Jennifer Denetdal',
                bio: 'Placeholder bio. Bold Teec Nos Pos designs and Wide Ruins runners.',
                products: [
                    { id: 'rg-401', name: 'Teec Nos Pos Rug', price: 2600, dealerPrice: 7000 },
                    { id: 'rg-402', name: 'Wide Ruins Runner', price: 900, dealerPrice: 2400 }
                ]
            }
        }
    }
};

const pageCategory = ['jewelry', 'pottery', 'rugs']
    .find(c => document.body.classList.contains(`theme-${c}`));
const artistOverlay = document.getElementById('artist-overlay');

if (pageCategory && artistOverlay) initArtistOverlay();

function initArtistOverlay() {
    const { colors, artists } = artistData[pageCategory];
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
    btn.addEventListener('click', () => {
        // Later: POST getCart() to /api/orders on the Express backend
        localStorage.removeItem(CART_KEY);
        updateCartCount();
        renderCart();
        document.getElementById('cart-empty-msg').textContent =
            'Thank you! Your order has been placed (demo — no payment taken).';
    });
}

// ===== INIT =====
updateCartCount();
renderCart();
initCheckout();

// Keep the count in sync if the cart changes in another tab
window.addEventListener('storage', e => {
    if (e.key === CART_KEY) {
        updateCartCount();
        renderCart();
    }
});