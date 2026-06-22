import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// KONFIGURASI FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAFCQw6Z6xMKRfJtSyD6HqOFxvLhj26J3w",
    authDomain: "warung-madona.firebaseapp.com",
    projectId: "warung-madona",
    storageBucket: "warung-madona.firebasestorage.app",
    messagingSenderId: "344709595688",
    appId: "1:344709595688:web:7a7bc2e65706a32854ab1d",
    measurementId: "G-SBW637XJZF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const WA_MADONA = "6281412405437"; 

let menuDatabase = [];
let shoppingCart = [];

document.addEventListener("DOMContentLoaded", () => {
    loadMenuFromFirebase();
    setupUIInteractions();
});

// 1. TARIK DATA DARI FIREBASE
async function loadMenuFromFirebase() {
    const container = document.getElementById('menu-container');
    try {
        const q = query(collection(db, "madona_menu"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        menuDatabase = [];
        snapshot.forEach((doc) => {
            menuDatabase.push({ id: doc.id, ...doc.data() });
        });
        renderMenuCards(menuDatabase);
    } catch (error) {
        console.error("Error loading menu:", error);
        if (container) {
            container.innerHTML = `<p style="text-align:center; color:#ef4444; width:100%; grid-column: 1 / -1; font-weight:600;">Gagal terhubung dengan server dapur Madona.</p>`;
        }
    }
}

// 2. RENDER MENU DENGAN DETAIL PANJANG
function renderMenuCards(menus) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    if (menus.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); width:100%; grid-column: 1 / -1; padding: 40px 0;">Belum ada menu yang siap di dapur.</p>`;
        return;
    }

    let html = '';
    menus.forEach(menu => {
        const isHabis = menu.status === 'Habis';
        const classHabis = isHabis ? 'is-habis' : '';
        const tagHabis = isHabis ? `<div class="badge-status status-habis">Stok Habis</div>` : '';
        const img = menu.fotoUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600';

        html += `
            <div class="menu-card ${classHabis}">
                <div class="menu-img-wrap">
                    ${tagHabis}
                    <img src="${img}" alt="${menu.nama}" class="menu-img">
                </div>
                <div class="menu-info">
                    <span class="menu-kat">${menu.kategori}</span>
                    <h3 class="menu-nama">${menu.nama}</h3>
                    <p class="menu-desc">${menu.deskripsi || 'Sajian hidangan Sunda premium khas Warung Madona.'}</p>
                    <div class="menu-bot">
                        <span class="menu-harga">Rp ${parseInt(menu.harga).toLocaleString('id-ID')}</span>
                        <button class="btn-pesan" onclick="openModal('${menu.id}')" ${isHabis ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus"></i> Pesan
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 3. LOGIKA MODAL LENGKAP
window.openModal = function(id) {
    const menu = menuDatabase.find(m => m.id === id);
    if (!menu) return;

    // Reset Form Input
    document.querySelector('input[name="opt-saji"][value="Dine-in"]').checked = true;
    document.getElementById('opt-pedas').value = "Original";
    document.getElementById('opt-suhu').value = "Dingin (Es)";
    document.getElementById('opt-catatan').value = '';
    document.querySelectorAll('input[name="chk-topping"]').forEach(cb => cb.checked = false);

    document.getElementById('modal-id-menu').value = id;
    document.getElementById('modal-nama-menu').innerText = menu.nama;

    document.getElementById('block-pedas').style.display = menu.kategori === 'Makanan' ? 'block' : 'none';
    document.getElementById('block-suhu').style.display = menu.kategori === 'Minuman' ? 'block' : 'none';

    const containerTopping = document.getElementById('topping-container');
    if (menu.toppings && menu.toppings.length > 0) {
        document.getElementById('block-topping').style.display = 'block';
        let topHtml = '';
        menu.toppings.forEach(top => {
            const isHabis = top.status === 'Habis';
            topHtml += `
                <label class="topping-item ${isHabis ? 'habis' : ''}">
                    <input type="checkbox" name="chk-topping" value="${top.nama}" ${isHabis ? 'disabled' : ''}>
                    <span>${top.nama}</span>
                    ${isHabis ? '<span class="badge-habis-top">Habis</span>' : ''}
                </label>
            `;
        });
        containerTopping.innerHTML = topHtml;
    } else {
        document.getElementById('block-topping').style.display = 'none';
    }

    const modal = document.getElementById('modal-kustom');
    if (modal) modal.classList.add('show');
}

// 4. INTERAKSI UI LENGKAP
function setupUIInteractions() {
    const modal = document.getElementById('modal-kustom');
    const closeMdl = document.querySelector('.close-modal');
    if (closeMdl) closeMdl.onclick = () => modal.classList.remove('show');
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const kat = btn.getAttribute('data-filter');
            if (kat === 'Semua') {
                renderMenuCards(menuDatabase);
            } else {
                renderMenuCards(menuDatabase.filter(m => m.kategori === kat));
            }
        };
    });

    document.getElementById('btn-tambah-keranjang').onclick = () => {
        const id = document.getElementById('modal-id-menu').value;
        const menu = menuDatabase.find(m => m.id === id);
        
        let detail = document.querySelector('input[name="opt-saji"]:checked').value;
        if(menu.kategori === 'Makanan') detail += ` | ${document.getElementById('opt-pedas').value}`;
        if(menu.kategori === 'Minuman') detail += ` | ${document.getElementById('opt-suhu').value}`;
        
        const chk = document.querySelectorAll('input[name="chk-topping"]:checked');
        let tops = [];
        chk.forEach(c => tops.push(c.value));
        
        if(tops.length > 0) detail += ` | Varian: ${tops.join(', ')}`;
        
        const note = document.getElementById('opt-catatan').value.trim();
        shoppingCart.push({ id: menu.id, nama: menu.nama, harga: menu.harga, detail: detail, note: note, qty: 1 });
        
        modal.classList.remove('show');
        updateCartUI();
        document.getElementById('sidebar-keranjang').classList.add('open');
    };

    document.getElementById('fab-cart').onclick = () => document.getElementById('sidebar-keranjang').classList.add('open');
    document.querySelector('.close-cart').onclick = () => document.getElementById('sidebar-keranjang').classList.remove('open');
    document.getElementById('btn-checkout-wa').onclick = processCheckout;
}

// 5. MANAJEMEN KERANJANG PANJANG
function updateCartUI() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    let html = '';
    let total = 0;
    let qty = 0;
    
    shoppingCart.forEach((item, i) => {
        const subtotal = item.harga * item.qty;
        total += subtotal;
        qty += item.qty;
        html += `
            <div class="cart-item">
                <button class="btn-del-item" onclick="delItem(${i})"><i class="fa-solid fa-trash-can"></i></button>
                <h4>${item.nama}</h4>
                <p>${item.detail}${item.note ? `<br><em>Catatan: ${item.note}</em>` : ''}</p>
                <div class="cart-item-row">
                    <span class="cart-item-price">Rp ${subtotal.toLocaleString('id-ID')}</span>
                    <div class="qty-box">
                        <button class="qty-btn" onclick="chgQty(${i}, -1)">-</button>
                        <span style="font-weight:700; width:20px; text-align:center;">${item.qty}</span>
                        <button class="qty-btn" onclick="chgQty(${i}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p style="text-align:center; color:var(--text-muted); margin-top:20px;">Keranjang masih kosong.</p>';
    document.getElementById('total-harga').innerText = `Rp ${total.toLocaleString('id-ID')}`;
    document.getElementById('fab-count').innerText = qty;
}

window.chgQty = function(i, delta) {
    shoppingCart[i].qty += delta;
    if(shoppingCart[i].qty <= 0) {
        shoppingCart.splice(i, 1);
    }
    updateCartUI();
};

window.delItem = function(i) {
    shoppingCart.splice(i, 1);
    updateCartUI();
};

// 6. CHECKOUT WHATSAPP PANJANG
function processCheckout() {
    const nama = document.getElementById('nama-pelanggan').value.trim();
    const alamat = document.getElementById('alamat-pelanggan').value.trim();
    if(!nama || !alamat) return alert("Mohon lengkapi Nama Pemesan dan Alamat/No Meja Anda!");
    if(shoppingCart.length === 0) return alert("Keranjang belanja Anda masih kosong!");

    let total = 0;
    let struk = `*🧾 NOTA PESANAN - WARUNG MADONA*\n----------------------------------------\n`;
    struk += `👤 *Pemesan:* ${nama}\n`;
    struk += `📍 *Lokasi/Meja:* ${alamat}\n`;
    struk += `----------------------------------------\n\n`;
    struk += `🛒 *DETAIL HIDANGAN:*`;
    
    shoppingCart.forEach(item => {
        const sub = item.harga * item.qty;
        total += sub;
        struk += `\n\n🔸 *${item.qty}x ${item.nama}*\n`;
        struk += `   • Varian: ${item.detail}\n`;
        if(item.note) {
            struk += `   • Catatan: ${item.note}\n`;
        }
        struk += `   • Subtotal: Rp ${sub.toLocaleString('id-ID')}`;
    });
    
    struk += `\n\n----------------------------------------\n`;
    struk += `💰 *TOTAL TAGIHAN: Rp ${total.toLocaleString('id-ID')}*\n`;
    struk += `----------------------------------------\n\n`;
    struk += `Mohon segera diproses ya Mang!\nHatur nuhun 🙏✨`;

    window.open(`https://wa.me/${WA_MADONA}?text=${encodeURIComponent(struk)}`, '_blank');
}