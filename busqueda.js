console.log("🔍 busqueda.js cargado");

// ============================================================
//  CONFIGURACIÓN DE LA API
// ============================================================

const WC_API_URL_BUSQUEDA = 'https://olivedrab-deer-648705.hostingersite.com/api/wp-json/positivo/v1/products';
const WC_PER_PAGE_BUSQUEDA = 100;

// ============================================================
//  PARÁMETROS DE LA URL
// ============================================================

const paramsSearch    = new URLSearchParams(window.location.search);
const terminoBusqueda = paramsSearch.get('q') || '';

console.log("Término buscado:", terminoBusqueda);


// ============================================================
//  MAPEO
// ============================================================

function mapearProductoWC_busqueda(p) {
  const precioRaw = parseInt(p.prices?.price ?? p.prices?.regular_price ?? '0', 10);
  const precio    = precioRaw;

  const imagen = p.images?.[0]?.src ?? 'placeholder.jpg';

  const cats = p.categories ?? [];
  let categoria = 'otros';
  if (cats.length > 0) {
    const conLink = cats.filter(c => c.link);
    if (conLink.length > 0) {
      categoria = [...conLink].sort((a, b) => b.link.length - a.link.length)[0].slug;
    } else {
      categoria = cats[cats.length - 1].slug;
    }
  }

  const descripcionHTML = p.short_description || p.description || '';
  const descripcion     = descripcionHTML.replace(/<[^>]*>/g, '').trim();

  const caracteristicas = (p.attributes ?? []).map(attr => ({
    label: attr.name,
    value: (attr.terms ?? []).map(t => t.name).join(', ') || ''
  }));

  return {
    id:             String(p.id),
    nombre:         p.name ?? 'Producto sin nombre',
    precio,
    imagen,
    categoria,
    descripcion,
    caracteristicas
  };
}

async function fetchProductosBusqueda() {
  let productos  = [];
  let page       = 1;
  let totalPages = 1;

  do {
    const url      = `${WC_API_URL_BUSQUEDA}?per_page=${WC_PER_PAGE_BUSQUEDA}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const xTotalPages = response.headers.get('X-WP-TotalPages');
    if (xTotalPages) totalPages = parseInt(xTotalPages, 10);

    const data  = await response.json();
    const items = Array.isArray(data) ? data : (data.products ?? []);
    productos   = productos.concat(items.map(mapearProductoWC_busqueda));
    page++;
  } while (page <= totalPages);

  return productos;
}


// ============================================================
//  FUNCIÓN PRINCIPAL DE BÚSQUEDA
// ============================================================

async function realizarBusqueda() {
  console.log("🔍 Realizando búsqueda...");

  const contenedor    = document.getElementById('resultados');
  const sinResultados = document.getElementById('sin-resultados');
  const titulo        = document.querySelector('.busqueda_titulo');
  const info          = document.querySelector('.busqueda_info');

  if (contenedor) {
    contenedor.innerHTML = '<div class="loader"><div class="spinner"></div><p>Buscando productos...</p></div>';
    contenedor.style.display = 'grid';
  }
  if (sinResultados) sinResultados.style.display = 'none';

  if (!window.productosDB) {
    try {
      window.productosDB = await fetchProductosBusqueda();
      console.log('✅ productosDB cargado en búsqueda:', window.productosDB.length);
    } catch (err) {
      console.error('❌ Error cargando productos en búsqueda:', err);
      if (titulo) titulo.textContent = 'Error al cargar productos';
      if (info)   info.textContent   = 'No se pudo conectar con el servidor. Intentá más tarde.';
      if (contenedor) contenedor.style.display = 'none';
      if (sinResultados) sinResultados.style.display = 'block';
      return;
    }
  }

  const productos = window.productosDB;

  if (!terminoBusqueda) {
    if (titulo) titulo.textContent = 'Búsqueda vacía';
    if (info)   info.textContent   = 'Ingresa un término de búsqueda';
    if (contenedor)    contenedor.style.display    = 'none';
    if (sinResultados) sinResultados.style.display = 'block';
    return;
  }

  if (titulo) titulo.textContent = `Resultados para "${terminoBusqueda}"`;

  const texto      = terminoBusqueda.toLowerCase().trim();
  const resultados = productos.filter(producto => {
    const enNombre      = producto.nombre.toLowerCase().includes(texto);
    const enCategoria   = producto.categoria.toLowerCase().includes(texto);
    const enDescripcion = producto.descripcion ? producto.descripcion.toLowerCase().includes(texto) : false;
    const enCaracteristicas = producto.caracteristicas
      ? producto.caracteristicas.some(c =>
          c.label.toLowerCase().includes(texto) || c.value.toLowerCase().includes(texto)
        )
      : false;
    const enId = producto.id.toLowerCase().includes(texto);
    return enNombre || enCategoria || enDescripcion || enCaracteristicas || enId;
  });

  console.log("✅ Resultados encontrados:", resultados.length);

  if (resultados.length === 0) {
    if (info) info.textContent = 'No se encontraron productos';
    if (contenedor)    contenedor.style.display    = 'none';
    if (sinResultados) sinResultados.style.display = 'block';

    const sinResultadosTexto      = document.querySelector('.sin_resultados_texto');
    const sinResultadosSugerencia = document.querySelector('.sin_resultados_sugerencia');

    if (sinResultadosTexto) {
      sinResultadosTexto.textContent = `No se encontraron productos para "${terminoBusqueda}"`;
    }
    if (sinResultadosSugerencia) {
      sinResultadosSugerencia.innerHTML = `
        Intenta con otras palabras clave o buscá por categorías:<br>
        <small>Televisores, Aires, Celulares, Lavarropas, Heladeras, Cocinas, Parlantes</small>
      `;
    }
    return;
  }

  if (info) info.textContent = `${resultados.length} producto${resultados.length > 1 ? 's' : ''} encontrado${resultados.length > 1 ? 's' : ''}`;
  if (contenedor)    contenedor.style.display    = 'grid';
  if (sinResultados) sinResultados.style.display = 'none';

  contenedor.innerHTML = '';

  resultados.forEach(producto => {
    const card = document.createElement('a');
    card.href      = `muestra-producto.html?id=${producto.id}`;
    card.className = 'resultado_card';

    const precioFormateado    = `$${producto.precio.toLocaleString('es-AR')}`;
    const descripcionCorta    = producto.descripcion
      ? (producto.descripcion.length > 100 ? producto.descripcion.substring(0, 100) + '...' : producto.descripcion)
      : 'Producto disponible en Positivo Hogar';
    const categoriaFormateada = producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1);

    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}" class="resultado_imagen" loading="lazy">
      <strong class="resultado_precio main_product_price">${precioFormateado}</strong>
      <div class="resultado_categoria">${categoriaFormateada}</div>
      <h3 class="resultado_nombre">${producto.nombre}</h3>
      <p class="resultado_descripcion">${descripcionCorta}</p>
    `;

    contenedor.appendChild(card);
  });

  console.log("✅ Resultados renderizados");
}


// ============================================================
//  RESTAURAR TÉRMINO EN EL BUSCADOR DEL HEADER
// ============================================================

function actualizarBuscadorHeader() {
  const input = document.querySelector('.search_bar_input');
  if (input && terminoBusqueda) {
    input.value = terminoBusqueda;
    console.log("✅ Término de búsqueda restaurado en el header");
  }
}


// ============================================================
//  INICIALIZAR
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  console.log("🔄 DOM cargado - Iniciando búsqueda");
  setTimeout(() => realizarBusqueda(), 200);
  setTimeout(actualizarBuscadorHeader, 600);
});