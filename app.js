const productosIniciales = [
    // BEBIDAS
    { id: "P001", nombre: "Agua", precio: 1.00, stock: 22, categoria: "Bebidas" },
    { id: "P002", nombre: "Jugo", precio: 0.50, stock: 69, categoria: "Bebidas" },
    { id: "P003", nombre: "Soda", categoria: "Bebidas", variaciones: [
        { n: "Soda Regular", p: 1.25, s: 31 },
        { n: "Soda Chic Bote", p: 0.75, s: 0 }
    ]},
    { id: "P017", nombre: "Jugo/Té", categoria: "Bebidas", variaciones: [
        { n: "Jugo del Valle", p: 0.75, s: 3 },
        { n: "Té Frío", p: 0.85, s: 11 }
    ]},
    { id: "P004", nombre: "Té Caliente", precio: 0.50, stock: 44, categoria: "Bebidas" },
    { id: "P005", nombre: "Chocolate", precio: 1.00, stock: 13, categoria: "Bebidas" },

    // SNACKS
    { id: "P006", nombre: "Galletas", precio: 0.35, stock: 71, categoria: "Snacks" },
    { id: "P007", nombre: "Chiwis", precio: 0.65, stock: 26, categoria: "Snacks" },

    // COMIDA
    { id: "P008", nombre: "Emparedados", precio: 2.00, stock: 12, categoria: "Comida" },
    { id: "P009", nombre: "Empanadas", precio: 1.00, stock: 10, categoria: "Comida" },
    { id: "P010", nombre: "Empanadas Especiales", categoria: "Comida", variaciones: [
        { n: "Empanada Pollo", p: 1.00, s: 0 },
        { n: "Empanada Carne", p: 1.00, s: 19 }
    ]},
    { id: "P011", nombre: "Mafa", precio: 0.50, stock: 46, categoria: "Comida" },

    // OTROS
    { id: "P012", nombre: "Fruta", precio: 1.50, stock: 0, categoria: "Otros" },
    { id: "P014", nombre: "Hot Dog", precio: 2.00, stock: 0, categoria: "Comida" },
    { id: "P015", nombre: "Choco Cream", precio: 0.65, stock: 0, categoria: "Otros" },
    { id: "P016", nombre: "Arroz con Leche", precio: 1.00, stock: 0, categoria: "Otros" },
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
        class="px-4 py-2 rounded-full font-bold transition ${categoriaActiva === c ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}">
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
        btn.className = `p-4 rounded-xl border-b-4 flex flex-col items-center justify-center min-h-[110px] transition shadow-sm ${estaAgotado ? 'bg-gray-100 opacity-50 border-gray-400' : 'bg-white border-blue-900 active:scale-95'}`;
        
        // Lógica de visualización: Muestra "+" si tiene variaciones o es manual
        const visualPrecio = (p.variable || p.variaciones) 
            ? '<span class="text-2xl font-black text-blue-800">+</span>' 
            : `<span class="text-lg font-black text-blue-800">$${p.precio.toFixed(2)}</span>`;

        btn.innerHTML = `
            <span class="font-black uppercase text-[10px] text-gray-600 mb-1">${p.nombre}</span>
            ${visualPrecio}
            <span class="text-[9px] font-bold mt-1 ${stockTotal < 5 ? 'text-red-500' : 'text-gray-400'}">
                ${p.variable ? 'COBRO LIBRE' : 'STOCK: ' + stockTotal}
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
        class="w-full p-4 border-2 border-blue-100 rounded-xl mb-2 flex justify-between items-center font-bold hover:bg-blue-50 transition ${v.s <= 0 ? 'opacity-50 pointer-events-none bg-gray-100' : 'text-blue-900'}">
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
        <div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-b border-gray-200">
            <div class="flex flex-col">
                <span class="text-[11px] font-black uppercase">${i.nombre}</span>
                <span class="text-blue-700 font-bold">$${i.precio.toFixed(2)}</span>
            </div>
            <button onclick="eliminarItem(${idx})" class="text-red-500 hover:bg-red-100 p-1 rounded">❌</button>
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
        <tr class="border-b text-[11px] hover:bg-gray-50">
            <td class="p-2">${v.h}</td>
            <td class="p-2 uppercase font-medium">${v.items}</td>
            <td class="p-2 font-bold">${v.m}</td>
            <td class="p-2 font-black text-blue-900">$${v.t.toFixed(2)}</td>
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
                <tr class="border-b text-[12px]">
                    <td class="p-2 font-bold">${p.nombre}</td>
                    <td class="p-2 italic">${v.n}</td>
                    <td class="p-2 font-black ${v.s < 5 ? 'text-red-600' : 'text-green-700'}">${v.s}</td>
                    <td class="p-2 text-right">
                        <button onclick="sumarStockVar('${p.id}','${v.n}')" class="bg-blue-600 text-white px-2 rounded shadow">+</button>
                    </td>
                </tr>
            `).join('');
        } else {
            return `
                <tr class="border-b text-[12px]">
                    <td class="p-2 font-bold">${p.nombre}</td>
                    <td class="p-2 text-gray-400">-</td>
                    <td class="p-2 font-black ${p.stock < 5 ? 'text-red-600' : 'text-green-700'}">${p.stock}</td>
                    <td class="p-2 text-right">
                        <button onclick="sumarStock('${p.id}')" class="bg-blue-600 text-white px-2 rounded shadow">+</button>
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
