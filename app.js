import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// KONFIGURASI FIREBASE ASLI WARUNG MADONA
// ==========================================
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

// NOMOR WHATSAPP WARUNG MADONA
const WA_MADONA = "6281412405437"; 

let menuDatabase = [];
let shoppingCart = [];

document.addEventListener("DOMContentLoaded", () => {
    loadMenuFromFirebase();
    setupUIInteractions();
});

// 1. TARIK DATA DARI FIREBASE FIRESTORE
async function loadMenuFromFirebase() {
    const container = document.getElementById('menu-container');
    try {
        const q = query(collection(db, "madona_menu"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        menuDatabase = [];
        
        snapshot.forEach(doc => {
            menuDatabase.push({ id: doc.id, ...doc.data() });
        });
        
        renderMenuCards(menuDatabase);
    } catch (error) {
        console.error("Error mengambil data dapur:", error);
        if (container) {
            container.innerHTML = `<p style="text-align:center; color:#ef4444; width:100%; grid-column: 1 / -1; font-weight:600;">Gagal terhubung dengan server dapur Madona.</p>`;
        }
    }
}

// 2. TAMPILKAN KARTU MENU MEWAH
function renderMenuCards(menus) {
    const container = document.getElementById('menu-container');
    if (!container) return;

    if (menus.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); width:100%; grid-column: 1 / -1; padding: 40px 0;">Belum ada menu yang siap di dapur. Silakan tambahkan melalui halaman Admin.</p>`;
        return;
    }

    let html = '';
    menus.forEach(menu => {
        const isHabis = menu.status === 'Habis';
        const classHabis = isHabis ? 'is-habis' : '';
        const tagHabis = isHabis ? `<div class="badge-status status-habis">Stok Habis</div>` : '';
        
        // Membaca Base64 string foto langsung atau menggunakan placeholder jika kosong
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

// 3. LOGIKA POPUP MODAL & TOPIING VARIANT
window.openModal = function(id) {
    const menu = menuDatabase.find(m => m.id === id);
    if (!menu) return;

    document.getElementById('modal-id-menu').value = id;
    document.getElementById('modal-kategori-menu').value = menu.kategori;
    document.getElementById('modal-nama-menu').innerText = menu.nama;
    document.getElementById('opt-catatan').value = '';

    // Filter Tampilan Form Sesuai Kategori
    document.getElementById('block-pedas').style.display = menu.kategori === 'Makanan' ? 'block' : 'none';
    document.getElementById('block-suhu').style.display = menu.kategori === 'Minuman' ? 'block' : 'none';

    // Ambil Data Sub-Topping Dinamis dari Firebase Array
    const blockTopping = document.getElementById('block-topping');
    const containerTopping = document.getElementById('topping-container');
    
    if (menu.toppings && menu.toppings.length > 0) {
        blockTopping.style.display = 'block';
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
        blockTopping.style.display = 'none';
        containerTopping.innerHTML = '';
    }

    const modal = document.getElementById('modal-kustom');
    if (modal) modal.classList.add('show');
}

// 4. INTERAKSI KERANJANG DAN FORM CHECKOUT
function setupUIInteractions() {
    const modal = document.getElementById('modal-kustom');
    const closeMdl = document.querySelector('.close-modal');
    if (closeMdl) closeMdl.onclick = () => modal.classList.remove('show');
    
    // Filter Kategori Tab Depan
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const kat = btn.getAttribute('data-filter');
            renderMenuCards(kat === 'Semua' ? menuDatabase : menuDatabase.filter(m => m.kategori === kat));
        };
    });

    // Masukkan Pilihan Menu ke Struk Keranjang
    const btnAddCart = document.getElementById('btn-tambah-keranjang');
    if (btnAddCart) {
        btnAddCart.onclick = () => {
            const id = document.getElementById('modal-id-menu').value;
            const menu = menuDatabase.find(m => m.id === id);
            
            let detail = document.querySelector('input[name="opt-saji"]:checked').value;
            if(menu.kategori === 'Makanan') detail += ` | ${document.getElementById('opt-pedas').value}`;
            if(menu.kategori === 'Minuman') detail += ` | ${document.getElementById('opt-suhu').value}`;
            
            const chk = document.querySelectorAll('input[name="chk-topping"]:checked');
            let tops = Array.from(chk).map(c => c.value);
            if(tops.length > 0) detail += ` | Varian: ${tops.join(', ')}`;
            
            const note = document.getElementById('opt-catatan').value.trim();

            const idx = shoppingCart.findIndex(c => c.id === id && c.detail === detail && c.note === note);
            if(idx > -1) {
                shoppingCart[idx].qty += 1;
            } else {
                shoppingCart.push({ id: menu.id, nama: menu.nama, harga: menu.harga, detail: detail, note: note, qty: 1 });
            }
            
            modal.classList.remove('show');
            updateCartUI();
            document.getElementById('sidebar-keranjang').classList.add('open');
        };
    }

    // Navigasi Sidebar Slide Panel
    const fab = document.getElementById('fab-cart');
    if (fab) fab.onclick = () => document.getElementById('sidebar-keranjang').classList.add('open');
    
    const closeCrt = document.querySelector('.close-cart');
    if (closeCrt) closeCrt.onclick = () => document.getElementById('sidebar-keranjang').classList.remove('open');

    // Integrasi Kasir WhatsApp
    const btnCheckout = document.getElementById('btn-checkout-wa');
    if (btnCheckout) btnCheckout.onclick = processCheckout;
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    let html = '', total = 0, qty = 0;
    
    shoppingCart.forEach((item, i) => {
        total += item.harga * item.qty;
        qty += item.qty;
        html += `
            <div class="cart-item">
                <button class="btn-del-item" onclick="delItem(${i})"><i class="fa-solid fa-trash-can"></i></button>
                <h4>${item.nama}</h4>
                <p>${item.detail}${item.note ? `<br><em>Catatan: ${item.note}</em>` : ''}</p>
                <div class="cart-item-row">
                    <span class="cart-item-price">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</span>
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

window.chgQty = (i, delta) => { shoppingCart[i].qty += delta; if(shoppingCart[i].qty <= 0) shoppingCart.splice(i,1); updateCartUI(); };
window.delItem = i => { shoppingCart.splice(i,1); updateCartUI(); };

function processCheckout() {
    const nama = document.getElementById('nama-pelanggan').value.trim();
    const alamat = document.getElementById('alamat-pelanggan').value.trim();
    if(!nama || !alamat) return alert("Mohon lengkapi Nama Pemesan dan Alamat/No Meja Anda!");
    if(shoppingCart.length === 0) return alert("Keranjang belanja Anda masih kosong!");

    let total = 0;
    let struk = `✨ *WARUNG MADONA - STRUK PESANAN* ✨\n\n`;
    struk += `👤 *Pemesan:* ${nama}\n📍 *Lokasi/Meja:* ${alamat}\n`;
    struk += `=========================\n`;
    
    shoppingCart.forEach(item => {
        const sub = item.harga * item.qty;
        total += sub;
        struk += `\n🍲 *${item.qty}x ${item.nama}*\n`;
        struk += `   _${item.detail}_\n`;
        if(item.note) struk += `   📝 Catatan: ${item.note}\n`;
        struk += `   💰 Rp ${sub.toLocaleString('id-ID')}\n`;
    });
    
    struk += `\n=========================\n`;
    struk += `🔥 *TOTAL TAGIHAN: Rp ${total.toLocaleString('id-ID')}*\n`;
    struk += `=========================\n\nMohon segera diproses ya Mang! Hatur nuhun 🙏`;

    window.open(`https://wa.me/${WA_MADONA}?text=${encodeURIComponent(struk)}`, '_blank');
}