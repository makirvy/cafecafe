// ===== INVENTARIO =====
const productosIniciales = [
{ id:"P001", nombre:"Agua", precio:1, stock:22, categoria:"Bebidas" },
{ id:"P002", nombre:"Jugo", precio:0.5, stock:69, categoria:"Bebidas" },

{ id:"P003", nombre:"Soda", categoria:"Bebidas", variaciones:[
{ n:"Soda Regular", p:1.25, s:31 },
{ n:"Soda Chic Bote", p:0.75, s:0 }
]},

{ id:"P017", nombre:"Jugo/Té", categoria:"Bebidas", variaciones:[
{ n:"Jugo del Valle", p:0.75, s:3 },
{ n:"Té Frío", p:0.85, s:11 }
]},

{ id:"P004", nombre:"Té Caliente", precio:0.50, stock:44, categoria:"Bebidas" },

{ id:"P009", nombre:"Empanadas", categoria:"Comida", variaciones:[
{ n:"Emp Regular", p:1, s:10 },
{ n:"Emp Pollo", p:1, s:0 },
{ n:"Emp Carne", p:1, s:19 }
]},

{ id:"P011", nombre:"Mafa", precio:0.50, stock:46, categoria:"Snacks" },

{ id:"P005", nombre:"Chocolate", precio:1, stock:13, categoria:"Snacks" },
{ id:"P006", nombre:"Galletas", precio:0.35, stock:71, categoria:"Snacks" },
{ id:"P007", nombre:"Chiwis", precio:0.65, stock:26, categoria:"Snacks" },

{ id:"P008", nombre:"Emparedados", precio:2, stock:12, categoria:"Comida" },

{ id:"OTRO", nombre:"Otros", variable:true, categoria:"Otros" }
];

// ===== ESTADO =====
let db = JSON.parse(localStorage.getItem('pos_db')) || productosIniciales;
let carrito = [];
let total = 0;
let categoriaActual = "Todos";

// ===== VISTAS =====
function cambiarVista(v){
document.getElementById('vista-caja').classList.add('hidden');
document.getElementById('vista-reportes').classList.add('hidden');
document.getElementById('vista-'+v).classList.remove('hidden');
if(v==='reportes') renderizarReportes();
}

// ===== CATEGORÍAS =====
function cargarCategorias(){
const cont = document.getElementById('filtros-categorias');

const categorias = ["Todos", ...new Set(db.map(p => p.categoria))];

cont.innerHTML = categorias.map(cat => `
<button onclick="filtrarCategoria('${cat}')"
class="px-4 py-2 rounded-lg border font-bold whitespace-nowrap
${cat === categoriaActual ? 'bg-blue-900 text-white' : 'bg-white'}">
${cat}
</button>
`).join('');
}

function filtrarCategoria(cat){
categoriaActual = cat;
cargarProductos();
cargarCategorias();
}

// ===== PRODUCTOS =====
function cargarProductos(){
const grid=document.getElementById('grid-productos');
grid.innerHTML='';

const productosFiltrados = categoriaActual === "Todos"
? db
: db.filter(p => p.categoria === categoriaActual);

productosFiltrados.forEach(p=>{

let stock=p.variaciones ? p.variaciones.reduce((a,b)=>a+b.s,0) : p.stock;

let btn=document.createElement('button');
btn.className="bg-white p-4 rounded shadow";

btn.onclick=()=>manejarClick(p);

btn.innerHTML=`
<b>${p.nombre}</b><br>
${p.precio?('$'+p.precio):''}<br>
Stock:${stock}
`;

grid.appendChild(btn);
});
}

// ===== CLICK =====
function manejarClick(p){
if(p.variable){
let val=prompt("Monto:");
if(val) agregar("Manual",parseFloat(val));
return;
}

if(p.variaciones){ abrirModal(p); return; }

if(p.stock<=0) return;
agregar(p.nombre,p.precio);
}

// ===== MODAL =====
function abrirModal(p){
let body=document.getElementById('opciones-variacion');
body.innerHTML='';

p.variaciones.forEach(v=>{
let b=document.createElement('button');
b.innerText=v.n+" $"+v.p;
b.className="block w-full border p-2 mb-2";
b.onclick=()=>{
if(v.s<=0) return;
agregar(v.n,v.p);
cerrarModal();
};
body.appendChild(b);
});

document.getElementById('modal-variaciones').classList.remove('hidden');
}

function cerrarModal(){
document.getElementById('modal-variaciones').classList.add('hidden');
}

// ===== CARRITO =====
function agregar(n,p){
carrito.push({n,p});
renderCarrito();
}

function renderCarrito(){
let div=document.getElementById('lista-pedido');
div.innerHTML='';

carrito.forEach(i=>{
div.innerHTML+=`<div>${i.n} - $${i.p}</div>`;
});

total=carrito.reduce((a,b)=>a+b.p,0);
document.getElementById('total-pagar').innerText="$"+total;

calcularVuelto();
}

// ===== LIMPIAR =====
function limpiarPedido(){
carrito=[];
renderCarrito();
document.getElementById('efectivo-recibido').value='';
}

// ===== VENTA =====
function finalizarVenta(m){
if(!carrito.length) return;

carrito.forEach(i=>{
db.forEach(p=>{
if(p.stock && p.nombre===i.n && p.stock>0) p.stock--;
if(p.variaciones){
let v=p.variaciones.find(x=>x.n===i.n);
if(v && v.s>0) v.s--;
}
});
});

let hist=JSON.parse(localStorage.getItem('ventas_data'))||[];

hist.push({h:new Date().toLocaleTimeString(),items:carrito.map(x=>x.n).join(','),m,t:total});

localStorage.setItem('ventas_data',JSON.stringify(hist));
localStorage.setItem('pos_db',JSON.stringify(db));

limpiarPedido();
cargarProductos();
renderizarReportes();
}

// ===== REPORTES =====
function renderizarReportes(){
let v=JSON.parse(localStorage.getItem('ventas_data'))||[];

document.getElementById('tabla-ventas-cuerpo').innerHTML=
v.map(x=>`<tr><td>${x.h}</td><td>${x.items}</td><td>${x.m}</td><td>$${x.t}</td></tr>`).join('');

let efe=v.filter(x=>x.m==='Efectivo').reduce((a,b)=>a+b.t,0);
let yap=v.filter(x=>x.m==='Yappy').reduce((a,b)=>a+b.t,0);

document.getElementById('resumen-efectivo').innerText="$"+efe;
document.getElementById('resumen-yappy').innerText="$"+yap;
document.getElementById('resumen-total').innerText="$"+(efe+yap);

// INVENTARIO
let t=document.getElementById('tabla-inventario');

t.innerHTML=db.map(p=>{
if(p.variaciones){
return p.variaciones.map(v=>`
<tr>
<td>${p.nombre}</td>
<td>${v.n}</td>
<td style="color:${v.s<=5?'red':'green'}">${v.s}</td>
<td><button onclick="sumarVar('${p.id}','${v.n}')">+</button></td>
</tr>`).join('');
}

return `
<tr>
<td>${p.nombre}</td>
<td>-</td>
<td style="color:${p.stock<=5?'red':'green'}">${p.stock}</td>
<td><button onclick="sumarStock('${p.id}')">+</button></td>
</tr>`;
}).join('');
}

// ===== STOCK =====
function sumarStock(id){
let c=parseInt(prompt("Cantidad"));
if(!c) return;
db.find(p=>p.id===id).stock+=c;
guardar();
}

function sumarVar(id,n){
let c=parseInt(prompt("Cantidad"));
if(!c) return;
let p=db.find(x=>x.id===id);
p.variaciones.find(v=>v.n===n).s+=c;
guardar();
}

function guardar(){
localStorage.setItem('pos_db',JSON.stringify(db));
renderizarReportes();
cargarProductos();
}

// ===== OTROS =====
function calcularVuelto(){
let r=parseFloat(document.getElementById('efectivo-recibido').value)||0;
let v=r-total;
document.getElementById('cambio-vuelto').innerText="VUELTO: $"+(v>0?v:0);
}

document.getElementById('efectivo-recibido').addEventListener('input',calcularVuelto);

setInterval(()=>{
document.getElementById('reloj').innerText=new Date().toLocaleTimeString();
},1000);

// INIT
cargarCategorias();
cargarProductos();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
