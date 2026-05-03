// ================= CONFIGURACIÓN INICIAL COMPLETA =================
const productosIniciales = [
    // BEBIDAS
    { id: "P001", nombre: "Agua", precio: 1.00, stock: 22, categoria: "Bebidas" },
    { id: "P002", nombre: "Café", categoria: "Bebidas", variaciones: [
        { n: "Café Negro", p: 0.50, s: 50 },
        { n: "Café con Leche", p: 0.85, s: 50 }
    ]},
    { id: "P003", nombre: "Té Caliente", categoria: "Bebidas", variaciones: [
        { n: "Té Normal", p: 0.50, s: 44 },
        { n: "Té con Leche", p: 0.65, s: 20 }
    ]},
    { id: "P004", nombre: "Jugos", categoria: "Bebidas", variaciones: [
        { n: "Jugo Chico", p: 0.50, s: 69 },
        { n: "Jugo del Valle", p: 0.75, s: 10 },
        { n: "Té Frío", p: 0.85, s: 15 }
    ]},
    { id: "P005", nombre: "Soda", categoria: "Bebidas", variaciones: [
        { n: "Soda Regular", p: 1.25, s: 31 },
        { n: "Soda Chic Bote", p: 0.75, s: 10 }
    ]},
    { id: "P013", nombre: "Chocolate", precio: 1.00, stock: 13, categoria: "Bebidas" },

    // SNACKS
    { id: "P006", nombre: "Chiwuis", categoria: "Snacks", variaciones: [
        { n: "Rizadas Mayonesa", p: 0.65, s: 15 },
        { n: "Cebolla", p: 0.65, s: 15 },
        { n: "Doritos", p: 0.65, s: 15 },
        { n: "Golpe", p: 0.65, s: 15 }
    ]},
    { id: "P007", nombre: "Galletas", categoria: "Snacks", variaciones: [
        { n: "Sorbeto", p: 0.35, s: 25 },
        { n: "Crisp de Sal", p: 0.35, s: 25 }
    ]},

    // COMIDA
    { id: "P008", nombre: "Empanadas", categoria: "Comida", variaciones: [
        { n: "Jamón y Queso", p: 1.00, s: 20 },
        { n: "Pollo", p: 1.00, s: 20 },
        { n: "Carne", p: 1.00, s: 20 }
    ]},
    { id: "P009", nombre: "Emparedados", precio: 2.00, stock: 12, categoria: "Comida" },
    { id: "P014", nombre: "Hot Dog", precio: 2.00, stock: 5, categoria: "Comida" },
    { id: "P011", nombre: "Mafa", precio: 0.50, stock: 46, categoria: "Comida" },

    // OTROS (POSTRES Y VARIOS)
    { id: "P012", nombre: "Fruta", precio: 1.50, stock: 5, categoria: "Otros" },
    { id: "P015", nombre: "Choco Cream", precio: 0.65, stock: 8, categoria: "Otros" },
    { id: "P016", nombre: "Arroz con Leche", precio: 1.00, stock: 10, categoria: "Otros" },
    { id: "P999", nombre: "Otros", variable: true, categoria: "Otros" }
];

// ================= ESTADO GLOBAL =================
let db = JSON.parse(localStorage.getItem('pos_db')) || productosIniciales;
let carrito = [];
let total = 0;
let categoriaActiva = "Todos";

// ================= NAVEGACIÓN =================
function cambiarVista(v) {
    document.getElementById('vista-caja').classList.add('hidden');
    document.getElementById('vista-reportes').classList.add('hidden');
    document.getElementById(`vista-${v}`).classList.remove('hidden');
    if(v === 'reportes') renderizarReportes();
}

// ================= CATEGORÍAS =================
function cargarCategorias() {
    const cont = document.getElementById('filtros-categorias');
    const cats = ["Todos", ...new Set(db.map(p => p.categoria))];

    cont.innerHTML = cats.map(c => `
        <button onclick="filtrarCategoria('${c}')"
        class="px-6 py-3 rounded-full font-black text-lg transition ${categoriaActiva === c ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-200 text-gray-700'}">
        ${c}
        </button>
    `).join('');
}

function filtrarCategoria(cat) {
    categoriaActiva = cat;
    cargarProductos();
    cargarCategorias();
}

// ================= RENDERIZADO DE PRODUCTOS =================
function cargarProductos() {
    const grid = document.getElementById('grid-productos');
    grid.innerHTML = '';

    db.filter(p => categoriaActiva === "Todos" || p.categoria === categoriaActiva)
    .forEach(p => {
        const stockTotal = p.variaciones 
            ? p.variaciones.reduce((a, b) => a + b.s, 0) 
            : p.stock;

        const estaAgotado = !p.variable && stockTotal <= 0;

        const btn = document.createElement('button');
        btn.className = `p-4 rounded-2xl border-b-8 flex flex-col items-center justify-center min-h-[140px] transition shadow-md ${estaAgotado ? 'bg-gray-100 opacity-50 border-gray-400' : 'bg-white border-blue-900 active:scale-95'}`;
        
        const visualPrecio = (p.variable || p.variaciones) 
            ? '<span class="text-4xl font-black text-blue-800">+</span>' 
            : `<span class="text-2xl font-black text-blue-800">$${p.precio.toFixed(2)}</span>`;

        btn.innerHTML = `
            <span class="font-black uppercase text-sm text-gray-700 mb-2">${p.nombre}</span>
            ${visualPrecio}
            <span class="text-xs font-bold mt-2 ${stockTotal < 5 ? 'text-red-500' : 'text-gray-500'}">
                ${p.variable ? 'COBRO LIBRE' : 'DISP: ' + stockTotal}
            </span>
        `;

        btn.onclick = () => manejarClick(p);
        grid.appendChild(btn);
    });
}

// ================= LÓGICA DE CLICK =================
function manejarClick(p) {
    if(p.variable) {
        const val = prompt("Monto a cobrar:");
        if(val && !isNaN(val)) agregarAlCarrito("Venta Manual", parseFloat(val));
    }
    else if(p.variaciones) {
        abrirModal(p);
    }
    else if(p.stock > 0) {
        agregarAlCarrito(p.nombre, p.precio);
    }
}

// ================= MODAL DE VARIACIONES =================
function abrirModal(p) {
    const cuerpo = document.getElementById('opciones-variacion');
    const titulo = document.getElementById('modal-titulo');
    
    if(titulo) titulo.innerText = p.nombre;

    cuerpo.innerHTML = p.variaciones.map(v => `
        <button onclick="agregarAlCarrito('${v.n}', ${v.p}); cerrarModal();"
        class="w-full p-6 border-4 border-blue-100 rounded-2xl mb-3 flex justify-between items-center font-black text-xl hover:bg-blue-50 transition ${v.s <= 0 ? 'opacity-50 pointer-events-none bg-gray-100' : 'text-blue-900'}">
            <span>${v.n}</span>
            <span>$${v.p.toFixed(2)}</span>
        </button>
    `).join('');

    document.getElementById('modal-variaciones').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modal-variaciones').classList.add('hidden');
}

// ================= GESTIÓN DEL CARRITO =================
function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-pedido');
    lista.innerHTML = carrito.map((i, idx) => `
        <div class="flex justify-between items-center bg-white p-3 mb-2 rounded-xl border-l-8 border-blue-900 shadow-sm">
            <div class="flex flex-col">
                <span class="text-sm font-black uppercase text-gray-800">${i.nombre}</span>
                <span class="text-blue-700 font-black text-lg">$${i.precio.toFixed(2)}</span>
            </div>
            <button onclick="eliminarItem(${idx})" class="text-red-500 bg-red-50 p-2 rounded-full text-xl">✕</button>
        </div>
    `).join('');

    total = carrito.reduce((a, b) => a + b.precio, 0);
    document.getElementById('total-pagar').innerText = `$${total.toFixed(2)}`;
    calcularVuelto();
}

function eliminarItem(i) {
    carrito.splice(i, 1);
    actualizarCarritoUI();
}

function limpiarPedido() {
    carrito = [];
    const inputEfec = document.getElementById('efectivo-recibido');
    if(inputEfec) inputEfec.value = '';
    actualizarCarritoUI();
}

function calcularVuelto() {
    const input = document.getElementById('efectivo-recibido');
    const rec = parseFloat(input.value) || 0;
    const v = rec - total;
    document.getElementById('cambio-vuelto').innerText = `VUELTO: $${(v > 0 ? v : 0).toFixed(2)}`;
}

// ================= FINALIZAR VENTA =================
function finalizarVenta(metodo) {
    if(carrito.length === 0) return;

    carrito.forEach(item => {
        db.forEach(p => {
            if(p.nombre === item.nombre && p.stock !== undefined) {
                p.stock--;
            }
            if(p.variaciones) {
                const v = p.variaciones.find(x => x.n === item.nombre);
                if(v) v.s--;
            }
        });
    });

    let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
    ventas.push({
        h: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: carrito.map(i => i.nombre).join(', '),
        m: metodo,
        t: total
    });

    localStorage.setItem('ventas', JSON.stringify(ventas));
    localStorage.setItem('pos_db', JSON.stringify(db));

    limpiarPedido();
    cargarProductos();
}

// ================= REPORTES =================
function renderizarReportes() {
    let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
    const tablaVentas = document.getElementById('tabla-ventas-cuerpo');

    tablaVentas.innerHTML = ventas.slice().reverse().map(v => `
        <tr class="border-b text-sm hover:bg-gray-50">
            <td class="p-3">${v.h}</td>
            <td class="p-3 uppercase font-bold">${v.items}</td>
            <td class="p-3 font-black text-blue-700">${v.m}</td>
            <td class="p-3 font-black">$${v.t.toFixed(2)}</td>
        </tr>
    `).join('');

    let efe = ventas.filter(v => v.m === "Efectivo").reduce((a, b) => a + b.t, 0);
    let yap = ventas.filter(v => v.m === "Yappy").reduce((a, b) => a + b.t, 0);

    document.getElementById('resumen-efectivo').innerText = `$${efe.toFixed(2)}`;
    document.getElementById('resumen-yappy').innerText = `$${yap.toFixed(2)}`;
    document.getElementById('resumen-total').innerText = `$${(efe + yap).toFixed(2)}`;

    renderInventario();
}

// ================= INVENTARIO =================
function renderInventario() {
    const tabla = document.getElementById('tabla-inventario');
    
    tabla.innerHTML = db.filter(p => !p.variable).map(p => {
        if(p.variaciones) {
            return p.variaciones.map(v => `
                <tr class="border-b text-sm">
                    <td class="p-3 font-black uppercase">${p.nombre}</td>
                    <td class="p-3 italic text-gray-600">${v.n}</td>
                    <td class="p-3 font-black ${v.s < 5 ? 'text-red-600' : 'text-green-700'}">${v.s}</td>
                    <td class="p-3 text-right">
                        <button onclick="sumarStockVar('${p.id}','${v.n}')" class="bg-blue-600 text-white px-4 py-1 rounded-lg shadow-md font-black">+</button>
                    </td>
                </tr>
            `).join('');
        } else {
            return `
                <tr class="border-b text-sm">
                    <td class="p-3 font-black uppercase">${p.nombre}</td>
                    <td class="p-3 text-gray-400">-</td>
                    <td class="p-3 font-black ${p.stock < 5 ? 'text-red-600' : 'text-green-700'}">${p.stock}</td>
                    <td class="p-3 text-right">
                        <button onclick="sumarStock('${p.id}')" class="bg-blue-600 text-white px-4 py-1 rounded-lg shadow-md font-black">+</button>
                    </td>
                </tr>
            `;
        }
    }).join('');
}

function sumarStock(id) {
    const cant = parseInt(prompt("Cantidad a ingresar:"));
    if(!cant || isNaN(cant)) return;
    db.forEach(p => { if(p.id === id) p.stock += cant; });
    actualizarDBLocal();
}

function sumarStockVar(id, nombre) {
    const cant = parseInt(prompt("Cantidad a ingresar:"));
    if(!cant || isNaN(cant)) return;
    db.forEach(p => {
        if(p.id === id) {
            const v = p.variaciones.find(x => x.n === nombre);
            if(v) v.s += cant;
        }
    });
    actualizarDBLocal();
}

function actualizarDBLocal() {
    localStorage.setItem('pos_db', JSON.stringify(db));
    renderInventario();
    cargarProductos();
}

// ================= INICIALIZACIÓN =================
window.onload = () => {
    const inputEfec = document.getElementById('efectivo-recibido');
    if(inputEfec) inputEfec.addEventListener('input', calcularVuelto);
    setInterval(() => {
        const reloj = document.getElementById('reloj');
        if(reloj) reloj.innerText = new Date().toLocaleTimeString();
    }, 1000);
    cargarCategorias();
    cargarProductos();
};
