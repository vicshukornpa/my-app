const firebaseConfig = {
  apiKey: "AIzaSyCb37f1DJNaMKwnd70T0A0cJv6MmknpID4",
  authDomain: "my-product-app-2f64c.firebaseapp.com",
  projectId: "my-product-app-2f64c",
  storageBucket: "my-product-app-2f64c.firebasestorage.app",
  messagingSenderId: "1062304086333",
  appId: "1:1062304086333:web:e05d342e9d26ad0d1b6d54",
  measurementId: "G-79SVR6HJV0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let editingId = null;

function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 2800);
}

async function checkConnection() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');

    try {
        await db.collection('products').limit(1).get();
        dot.className = "w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse";
        text.textContent = "เชื่อมต่อสำเร็จ";
        text.className = "text-sm text-emerald-400";
    } catch (e) {
        dot.className = "w-2.5 h-2.5 bg-red-500 rounded-full";
        text.textContent = "เชื่อมต่อล้มเหลว";
        text.className = "text-sm text-red-400";
        toast("เชื่อมต่อ Firebase ไม่สำเร็จ", 'error');
    }
}

async function loadProducts() {
    const container = document.getElementById('products');
    container.innerHTML = `<div class="col-span-full py-20 text-center"><div class="animate-spin w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full mx-auto"></div></div>`;

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        document.getElementById('count-badge').textContent = `${products.length} รายการ`;

        if (products.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400"><div class="text-6xl mb-3">📦</div><p>ยังไม่มีสินค้า</p></div>`;
            return;
        }

        container.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = "bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-gray-600 transition-all";
            div.innerHTML = `
                <div class="font-semibold text-lg mb-3">${p.name}</div>
                <div class="text-3xl font-mono text-amber-400 mb-6">${Number(p.price).toLocaleString()} <span class="text-base text-gray-500">บาท</span></div>
                <div class="flex gap-3">
                    <button onclick="openEdit('${p.id}', '${p.name.replace(/'/g,"\\'")}', ${p.price})" class="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-2xl text-sm">✏️ แก้ไข</button>
                    <button onclick="deleteProduct('${p.id}')" class="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-2xl text-sm">🗑️ ลบ</button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-red-400">โหลดข้อมูลไม่สำเร็จ</div>`;
    }
}

window.submitProduct = async () => {
    const name = document.getElementById('name').value.trim();
    const price = document.getElementById('price').value.trim();
    if (!name || !price) return toast('กรุณากรอกข้อมูลให้ครบ', 'error');

    const data = {
        detail:'รายละเอียดสินค้า',
        name, 
        price: Number(price), 
        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
    };

    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    try {
        if (editingId) {
            await db.collection('products').doc(editingId).update(data);
            toast('แก้ไขสำเร็จ');
        } else {
            await db.collection('products').add(data);
            toast('เพิ่มสินค้าสำเร็จ');
        }
        resetForm();
        loadProducts();
    } catch (e) {
        toast('เกิดข้อผิดพลาด', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = editingId ? '💾 บันทึก' : '➕ เพิ่มสินค้า';
    }
};

window.openEdit = (id, name, price) => {
    editingId = id;
    document.getElementById('name').value = name;
    document.getElementById('price').value = price;
    document.getElementById('form-title').textContent = 'แก้ไขสินค้า';
    document.getElementById('submit-btn').textContent = '💾 บันทึก';
    document.getElementById('cancel-btn').classList.remove('hidden');
};

window.cancelEdit = () => resetForm();

function resetForm() {
    editingId = null;
    document.getElementById('name').value = '';
    document.getElementById('price').value = '';
    document.getElementById('form-title').textContent = 'เพิ่มสินค้าใหม่';
    document.getElementById('submit-btn').textContent = '➕ เพิ่มสินค้า';
    document.getElementById('cancel-btn').classList.add('hidden');
}

window.deleteProduct = async (id) => {
    if (!confirm('ยืนยันลบ?')) return;
    try {
        await db.collection('products').doc(id).delete();
        toast('ลบสำเร็จ');
        loadProducts();
    } catch (e) {
        toast('ลบไม่สำเร็จ', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    loadProducts();
});