// ============================================================
//  PARSEAR DESCRIPCIÓN HTML → descripcion + caracteristicas
// ============================================================

function parsearDescripcionHTML(html) {
  if (!html) return { descripcion: '', caracteristicas: [] };

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let descripcion = '';
  let caracteristicas = [];

  // Buscar si existe el separador "Características:"
  const fullText = tempDiv.innerHTML;
  const separadorIndex = fullText.search(/Caracter[ií]sticas\s*:/i);

  if (separadorIndex !== -1) {
    // --- DESCRIPCIÓN: todo el texto antes de "Características:" ---
    const antesHTML = fullText.substring(0, separadorIndex);
    const antesDiv = document.createElement('div');
    antesDiv.innerHTML = antesHTML;
    descripcion = (antesDiv.textContent || antesDiv.innerText || '').trim();

    // Limpiar prefijo "Descripción corta:" si existe
    descripcion = descripcion.replace(/^Descripci[oó]n\s*corta\s*:\s*/i, '').trim();

    // --- CARACTERÍSTICAS: los <li> después de "Características:" ---
    const despuesHTML = fullText.substring(separadorIndex);
    const despuesDiv = document.createElement('div');
    despuesDiv.innerHTML = despuesHTML;

    const items = despuesDiv.querySelectorAll('li');
    items.forEach(li => {
      const textoLi = (li.textContent || li.innerText || '').trim();
      // Buscar patrón "Label: Valor"
      const match = textoLi.match(/^(.+?):\s*(.+)$/);
      if (match) {
        caracteristicas.push({
          label: match[1].trim(),
          value: match[2].trim()
        });
      }
    });
  } else {
    // No hay separador → toda la descripción va como texto plano
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

  const imagen = p.images?.[0]?.src ?? 'placeholder.jpg';

  const cats = p.categories ?? [];
  let categoria = 'otros';
  if (cats.length > 0) {
    const masEspecifica = [...cats].sort((a, b) => b.id - a.id)[0];
    categoria = masEspecifica.slug;
  }
  let preciof = parseInt(p.prices.sale_price);
  // Parsear descripción para extraer texto + características
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
//  CARGA DE TODOS LOS PRODUCTOS
// ============================================================

async function fetchTodosLosProductos() {
  let productos  = [];
  let page       = 1;
  let totalPages = 1;

  do {
    const url      = `https://olivedrab-deer-648705.hostingersite.com/api/wp-json/positivo/v1/products?per_page=100&page=${page}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Error HTTP ${response.status} al obtener productos`);

    const xTotalPages = response.headers.get('X-WP-TotalPages');
    if (xTotalPages) totalPages = parseInt(xTotalPages, 10);

    const data  = await response.json();
    const items = Array.isArray(data) ? data : (data.products ?? []);
    productos   = productos.concat(items.map(mapearProductoWC));

    page++;
  } while (page <= totalPages);

  return productos;
}


// ============================================================
//  INICIALIZACIÓN
// ============================================================

window.productosDB = null;
window.productosDBPromise = fetchTodosLosProductos()
  .then(productos => {
    window.productosDB = productos;
    console.log('✅ Base de datos WooCommerce cargada:', window.productosDB.length, 'productos');
    return productos;
  })
  .catch(error => {
    console.error('❌ Error cargando productos desde WooCommerce:', error);
    window.productosDB = [];
    return [];
  });


// ============================================================
//  LÓGICA SOLO PARA MUESTRA-PRODUCTO.HTML
// ============================================================

if (window.location.pathname.includes('muestra-producto')) {

  window.addEventListener('DOMContentLoaded', async () => {

    // Esperar a que la Promise resuelva en vez de polling con setTimeout
    if (!window.productosDB) {
      await window.productosDBPromise;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    console.log('Buscando producto id:', productId);

    const producto = window.productosDB.find(p => p.id === productId);

    if (!producto) {
      console.error('Producto no encontrado:', productId);
      const cont = document.querySelector('.only_product_container');
      if (cont) cont.innerHTML = '<p>Producto no encontrado.</p>';
      return;
    }

    console.log('✅ Cargando producto:', producto.nombre);
    console.log('Descripción:', producto.descripcion);

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

    if (producto.preciof !== "" && producto.preciof){
      precioelec = `<strong class="only_product_precio tachado">$${producto.precio.toLocaleString('es-AR')}</strong> 
      <strong class="only_product_precio">$${producto.preciof.toLocaleString('es-AR')}</strong>`;
    }

    console.log("precio:", producto.preciof);

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

    console.log('✅ Producto cargado correctamente');
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

  const mensaje           = `Hola! Me interesa el producto: ${producto.nombre} - $${producto.precio.toLocaleString('es-AR')}`;
  const mensajeCodificado = encodeURIComponent(mensaje);

  const numeroLasFlores = '5491144018147';
  const numeroMitre     = '5491187654321';

  botonesWhatsApp.forEach(boton => {
    const texto          = boton.textContent.toLowerCase();
    const numeroWhatsApp = texto.includes('mitre') ? numeroMitre : numeroLasFlores;
    const urlWhatsApp    = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;

    if (boton.tagName === 'A') {
      boton.href   = urlWhatsApp;
      boton.target = '_blank';
      boton.rel    = 'noopener noreferrer';
    } else {
      const btn = boton.closest('button') ?? boton;
      btn.onclick = () => window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
    }
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
    console.log('✅ Botón de volver configurado');
  }
});