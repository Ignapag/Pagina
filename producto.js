// ============================================================
//  PARSEAR DESCRIPCIÓN HTML → descripcion + caracteristicas
// ============================================================

function parsearDescripcionHTML(html) {
  if (!html) return { descripcion: '', caracteristicas: [] };

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let descripcion = '';
  let caracteristicas = [];

  const fullText = tempDiv.innerHTML;
  const separadorIndex = fullText.search(/Caracter[ií]sticas\s*:/i);

  if (separadorIndex !== -1) {
    const antesHTML = fullText.substring(0, separadorIndex);
    const antesDiv = document.createElement('div');
    antesDiv.innerHTML = antesHTML;
    descripcion = (antesDiv.textContent || antesDiv.innerText || '').trim();
    descripcion = descripcion.replace(/^Descripci[oó]n\s*corta\s*:\s*/i, '').trim();

    const despuesHTML = fullText.substring(separadorIndex);
    const despuesDiv = document.createElement('div');
    despuesDiv.innerHTML = despuesHTML;

    const items = despuesDiv.querySelectorAll('li');
    items.forEach(li => {
      const textoLi = (li.textContent || li.innerText || '').trim();
      const match = textoLi.match(/^(.+?):\s*(.+)$/);
      if (match) {
        caracteristicas.push({
          label: match[1].trim(),
          value: match[2].trim()
        });
      }
    });
  } else {
    descripcion = (tempDiv.textContent || tempDiv.innerText || '').trim();
    descripcion = descripcion.replace(/^Descripci[oó]n\s*corta\s*:\s*/i, '').trim();
  }

  return { descripcion, caracteristicas };
}


// ============================================================
//  MAPEO: WooCommerce → formato interno
// ============================================================

function mapearProductoWC(p) {
  const precioRaw = parseInt(p.prices?.regular_price ?? '0', 10);
  const precio    = precioRaw;
  const preciof   = parseInt(p.prices?.sale_price) || 0;

  const imagen = p.images?.[0]?.src ?? 'placeholder.jpg';

  const cats = p.categories ?? [];
  let categoria = 'otros';
  if (cats.length > 0) {
    const sinOferta = cats.filter(c => c.slug !== 'oferta');
    const catsFinal = sinOferta.length > 0 ? sinOferta : cats;
    const masEspecifica = [...catsFinal].sort((a, b) => b.id - a.id)[0];
    categoria = masEspecifica.slug;
  }

  const descripcionHTML = p.description || p.short_description || '';
  const { descripcion, caracteristicas } = parsearDescripcionHTML(descripcionHTML);

  return {
    id:             String(p.id),
    nombre:         p.name ?? 'Producto sin nombre',
    precio,
    preciof,
    imagen,
    categoria,
    descripcion,
    caracteristicas,
    _slug:          p.slug ?? ''
  };
}


// ============================================================
//  OBTENER UN PRODUCTO: API individual → caché → descarga completa
// ============================================================

const WC_API_URL_PRODUCTO = 'https://positivohogar.com.ar/api/wp-json/positivo/v1/products';
const CACHE_VERSION_PRODUCTO = 'v10';

async function obtenerProductoPorId(productId) {
  // 1) Primero: buscar en sessionStorage (instantáneo)
  try {
    const cache = sessionStorage.getItem('productosDB_' + CACHE_VERSION_PRODUCTO);
    if (cache) {
      const productos = JSON.parse(cache);
      const encontrado = productos.find(p => p.id === productId);
      if (encontrado) return encontrado; // ← sale aquí sin ningún fetch
    }
  } catch (e) {}

  // 2) Si no está en caché: llamar a la API individual
  try {
    const url = `${WC_API_URL_PRODUCTO}/${productId}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data.id) return mapearProductoWC(data);
    }
  } catch (e) {
    console.warn('⚠️ No se pudo traer producto individual');
  }

  // 3) Último recurso: descargar todo
  const response = await fetch(WC_API_URL_PRODUCTO);
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  const data = await response.json();
  const items = Array.isArray(data) ? data : (data.products ?? []);
  const productos = items.map(mapearProductoWC);

  try {
    sessionStorage.setItem('productosDB_' + CACHE_VERSION_PRODUCTO, JSON.stringify(productos));
  } catch (e) {}

  return productos.find(p => p.id === productId) || null;
}


// ============================================================
//  LÓGICA SOLO PARA MUESTRA-PRODUCTO.HTML
// ============================================================

if (window.location.pathname.includes('muestra-producto')) {

  // 🚀 Fetch arranca YA, sin esperar el DOM
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const productoPromise = productId 
    ? obtenerProductoPorId(productId) 
    : Promise.resolve(null);

  window.addEventListener('DOMContentLoaded', async () => {
    if (!productId) {
      const cont = document.querySelector('.only_product_container');
      if (cont) cont.innerHTML = '<p>Producto no encontrado.</p>';
      return;
    }

    // El fetch ya estaba corriendo, solo esperamos el resultado
    const producto = await productoPromise;

    if (!producto) {
      const cont = document.querySelector('.only_product_container');
      if (cont) cont.innerHTML = '<p>Producto no encontrado.</p>';
      return;
    }


    // Título
    document.querySelectorAll('.only_product_tittle').forEach(el => {
      el.textContent = producto.nombre;
    });

    // Imagen
    const imgEl = document.querySelector('.only_product_img');
    if (imgEl) {
      imgEl.src = producto.imagen;
      imgEl.alt = producto.nombre;
    }

    let precioelec = `<strong class="only_product_precio">$${producto.precio.toLocaleString('es-AR')}</strong>`;

    if (producto.preciof && producto.preciof !== producto.precio) {
      precioelec = `<strong class="only_product_precio tachado">$${producto.precio.toLocaleString('es-AR')}</strong> 
      <strong class="only_product_precio">$${producto.preciof.toLocaleString('es-AR')}</strong>`;
    }

    // Precio + Descripción
    const descEl = document.querySelector('.only_product_description');
    if (descEl) {
      const descripcionTexto = producto.descripcion || 'Producto de alta calidad disponible en Positivo Hogar.';
      descEl.innerHTML = `
        ${precioelec}
        <div style="display:flex; gap: 20px; flex-direction:column; margin-bottom: 1rem;">
          <strong style="font-size: 1.5rem; margin-top:20px;">Descripción:</strong>
          <p>${descripcionTexto}</p>
        </div>
      `;
    }

    // Categoría del producto
    document.body.dataset.productType = producto.categoria;

    // Características
    const ul = document.querySelector('.only_product_list');
    if (ul) {
      ul.innerHTML = '';

      const todosLosItems = [
        { label: 'Precio', value: `$${producto.precio.toLocaleString('es-AR')}` },
        ...producto.caracteristicas
      ];

      todosLosItems.forEach(carac => {
        const li = document.createElement('li');
        li.className = 'only_product_list_item';
        li.innerHTML = `
          <span class="feature-label">${carac.label}:</span>
          <span class="product_strong">${carac.value}</span>
        `;
        ul.appendChild(li);
      });
    }

    // Botones de WhatsApp
    configurarBotonesWhatsApp(producto);

  });
}


// ============================================================
//  AUXILIARES
// ============================================================

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function configurarBotonesWhatsApp(producto) {
  const botonesWhatsApp = document.querySelectorAll('.whatsapp');

  const precio            = producto.preciof && producto.preciof !== producto.precio
    ? producto.preciof
    : producto.precio;
  const mensaje           = `Hola! Me interesa el producto: ${producto.nombre} - $${precio.toLocaleString('es-AR')}`;
  const mensajeCodificado = encodeURIComponent(mensaje);

  const numeroLasFlores = '5491132330738';
  const numeroMitre     = '5491132904840';

  botonesWhatsApp.forEach(boton => {
    // Detectar sucursal por data-sucursal o por texto
    const sucursal = boton.dataset.sucursal || boton.textContent;
    const esMitre  = sucursal.toLowerCase().includes('mitre');
    const numero   = esMitre ? numeroMitre : numeroLasFlores;
    const url      = `https://wa.me/${numero}?text=${mensajeCodificado}`;

    boton.href   = url;
    boton.target = '_blank';
    boton.rel    = 'noopener noreferrer';
  });
}


// ============================================================
//  BOTÓN VOLVER
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('muestra-producto')) return;

  const botonVolver = document.querySelector('.only_product_button_back');
  if (botonVolver) {
    botonVolver.addEventListener('click', () => {
      if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    });
  }
});