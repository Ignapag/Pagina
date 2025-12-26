// producto.js

// ----------------------
// 1) DATA (con id + tipo)
// ----------------------
const productos = [
  {
    id: "aire-philco-3200",
    tipo: "aire", // (te sirve para CSS: aire / tv / etc.)
    nombre: "Aire Acondicionado Philco",
    imagen: "airepng.png",
    descripcion:
      "El aire acondicionado Philco es la solución perfecta para mantener tu hogar cómodo durante todo el año...",
    caracteristicas: [
      { label: "Modo Sleep", value: "Sí" },
      { label: "Control remoto", value: "Sí" },
      { label: "Temporizador", value: "Sí" },
      { label: "Potencia de refrigeración", value: "3200 frigorías" },
      { label: "Potencia de calefacción", value: "3400 kcal" }
    ]
  },
  {
    id: "tv-samsung-55",
    tipo: "tv",
    nombre: 'Smart TV Samsung 55"',
    imagen: "Televisor_prueba.webp",
    descripcion: 'Smart TV UHD 55".',
    caracteristicas: [
      { label: "Resolución", value: "4K" },
      { label: "Pulgadas", value: "55" },
      { label: "Sistema", value: "Tizen" }
    ]
  }
];

// ------------------------------------
// 2) OBTENER ID DESDE LA URL (?id=...)
// ------------------------------------
const params = new URLSearchParams(window.location.search);
const id = params.get("id"); // ej: aire-philco-3200

// Buscar producto por id (NO por índice)
const producto = productos.find((p) => p.id === id);

// ---------------------------
// 3) SI NO EXISTE, MENSAJE
// ---------------------------
if (!producto) {
  console.error("Producto no encontrado:", id);
  const cont = document.querySelector(".only_product_container");
  if (cont) cont.innerHTML = `<p>Producto no encontrado.</p>`;
} else {
  // ---------------------------
  // 4) CARGAR DATOS EN EL HTML
  // ---------------------------

  // Título
  const titleEl = document.querySelector(".only_product_tittle");
  if (titleEl) titleEl.textContent = producto.nombre;

  // Imagen
  const imgEl = document.querySelector(".only_product_img");
  if (imgEl) {
    imgEl.src = producto.imagen;
    imgEl.alt = producto.nombre;
  }

  // Descripción
  const descEl = document.querySelector(".only_product_description");
  if (descEl) descEl.textContent = producto.descripcion;

  // Tipo para CSS (body[data-product-type="tv"])
  document.body.dataset.productType = producto.tipo;

  // Características (label + value)
  const ul = document.querySelector(".only_product_list");
  if (ul) {
    ul.innerHTML = "";

    producto.caracteristicas.forEach((carac) => {
      const li = document.createElement("li");
      li.className = "only_product_list_item";
      li.innerHTML = `
        <span class="feature-label">${carac.label}:</span>
        <span class="feature-value">${carac.value}</span>
      `;
      ul.appendChild(li);
    });
  }
}
