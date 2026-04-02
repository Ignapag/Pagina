// ============================================================
//  CONFIGURACIÓN DE LA API
// ============================================================

const WC_API_URL_BUSQUEDA = 'https://positivohogar.com.ar/api/wp-json/positivo/v1/products';

// ============================================================
//  PARÁMETROS DE LA URL
// ============================================================

const paramsSearch    = new URLSearchParams(window.location.search);
const terminoBusqueda = paramsSearch.get('q') || '';



// ============================================================
//  PARSEAR DESCRIPCIÓN HTML → descripcion + caracteristicas
// ============================================================

function parsearDescripcionHTML_busqueda(html) {
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
//  MAPEO
// ============================================================

function mapearProductoWC_busqueda(p) {
  const precioRaw = parseInt(p.prices?.regular_price ?? '0', 10);
  const precio    = precioRaw;

  const imagen = p.images?.[0]?.src ?? 'placeholder.jpg';

  const cats = p.categories ?? [];
  let categoria = 'otros';
  if (cats.length > 0) {
    const sinOferta = cats.filter(c => c.slug !== 'oferta');
    const catsFinal = sinOferta.length > 0 ? sinOferta : cats;
    const conLink = catsFinal.filter(c => c.link);
    if (conLink.length > 0) {
      categoria = [...conLink].sort((a, b) => b.link.length - a.link.length)[0].slug;
    } else {
      categoria = catsFinal[catsFinal.length - 1].slug;
    }
  }
  let preciof = parseInt(p.prices.sale_price);
  const descripcionHTML = p.description || p.short_description || '';
  const { descripcion, caracteristicas } = parsearDescripcionHTML_busqueda(descripcionHTML);
  const stock = p.stock_quantity;
  return {
    id:             String(p.id),
    nombre:         p.name ?? 'Producto sin nombre',
    precio,
    imagen,
    categoria,
    descripcion,
    caracteristicas,
    preciof,
    stock
  };
}


// ============================================================
//  FETCH CON CACHÉ (reutiliza la del home si existe)
// ============================================================

const CACHE_VERSION_BUSQUEDA = 'v11';
const CACHE_KEY_BUSQUEDA = 'productosDB_busqueda_' + CACHE_VERSION_BUSQUEDA;

async function fetchTodosProductos() {
  // 1) Intentar sessionStorage
  try {
    const cache = sessionStorage.getItem(CACHE_KEY_BUSQUEDA);
    if (cache) {
      return JSON.parse(cache);
    }
  } catch (e) {}

  // 2) Descargar todo (una sola petición)
  const url = WC_API_URL_BUSQUEDA;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

  const data = await response.json();
  const items = Array.isArray(data) ? data : (data.products ?? []);
  const productos = items.map(mapearProductoWC_busqueda);

  try {
    sessionStorage.setItem(CACHE_KEY_BUSQUEDA, JSON.stringify(productos));
  } catch (e) {}

  return productos;
}


// ============================================================
//  FUNCIÓN PRINCIPAL DE BÚSQUEDA
// ============================================================

async function realizarBusqueda() {

  const contenedor    = document.getElementById('resultados');
  const sinResultados = document.getElementById('sin-resultados');
  const titulo        = document.querySelector('.busqueda_titulo');
  const info          = document.querySelector('.busqueda_info');

  if (contenedor) {
    contenedor.innerHTML = '<div class="loader"><div class="spinner"></div><p>Buscando productos...</p></div>';
    contenedor.style.display = 'grid';
  }
  if (sinResultados) sinResultados.style.display = 'none';

  if (!terminoBusqueda) {
    if (titulo) titulo.textContent = 'Búsqueda vacía';
    if (info)   info.textContent   = 'Ingresa un término de búsqueda';
    if (contenedor)    contenedor.style.display    = 'none';
    if (sinResultados) sinResultados.style.display = 'block';
    return;
  }

  if (titulo) titulo.textContent = `Resultados para "${terminoBusqueda}"`;

  let resultados = [];

  try {
    const productos = await fetchTodosProductos();
    const texto = terminoBusqueda.toLowerCase().trim().split(/\s+/).slice(0, 4).join(' ');

    resultados = productos.filter(producto => {
      // ✅ Ocultar productos sin stock (stock === 0 o stock === null)
      if (producto.stock !== null && producto.stock <= 0) return false;
      const enNombre = producto.nombre.toLowerCase().includes(texto);
      const enCategoria = producto.categoria.toLowerCase().includes(texto);
      return enNombre || enCategoria;
    });

    resultados.sort((a, b) => a.precio - b.precio);
  } catch (err) {
    console.error('❌ Error buscando productos:', err);
    if (titulo) titulo.textContent = 'Error al buscar productos';
    if (info)   info.textContent   = 'No se pudo conectar con el servidor. Intentá más tarde.';
    if (contenedor) contenedor.style.display = 'none';
    if (sinResultados) sinResultados.style.display = 'block';
    return;
  }


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

    const descripcionCorta    = producto.descripcion
      ? (producto.descripcion.length > 100 ? producto.descripcion.substring(0, 100) + '...' : producto.descripcion)
      : 'Producto disponible en Positivo Hogar';
    const categoriaFormateada = producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1);

    let precioelec = `<strong class="only_product_precio precio_busqueda">$${producto.precio.toLocaleString('es-AR')}</strong>`;

    if (producto.preciof && producto.preciof !== producto.precio) {
      precioelec = `<div><strong class="only_product_precio tachado precio_busqueda">$${producto.precio.toLocaleString('es-AR')}</strong> <strong class="only_product_precio precio_busqueda">$${producto.preciof.toLocaleString('es-AR')}</strong></div>`;
    }

    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}" class="resultado_imagen" loading="lazy">
      ${precioelec}
      <div class="resultado_categoria">${categoriaFormateada}</div>
      <h3 class="resultado_nombre">${producto.nombre}</h3>
      <p class="resultado_descripcion">${descripcionCorta}</p>
    `;

    contenedor.appendChild(card);
  });

}


// ============================================================
//  RESTAURAR TÉRMINO EN EL BUSCADOR DEL HEADER
// ============================================================

function actualizarBuscadorHeader() {
  const input = document.querySelector('.search_bar_input');
  if (input && terminoBusqueda) {
    input.value = terminoBusqueda;
  }
}


// ============================================================
//  INICIALIZAR
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  realizarBusqueda();
  setTimeout(actualizarBuscadorHeader, 600);
});