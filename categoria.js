// ============================================================
//  PÁGINA DE CATEGORÍA — categoria.js
// ============================================================

const CAT_API_URL   = 'https://olivedrab-deer-648705.hostingersite.com/api/wp-json/positivo/v1/products';
const CAT_CACHE_VER = 'v13';
const CAT_CACHE_KEY = 'productosDB_' + CAT_CACHE_VER;

const CATEGORIAS_PAGINA = {

  'tv-audio': {
    nombre: 'TV y Audio',
    icono:  'tv',
    slugs: ['auricular','minicomponente','parlante','radio','televisor']
  },

  'celulares': {
    nombre: 'Celulares',
    icono:  'smartphone',
    slugs: ['telefono-celular','telefono-celular-telefonia','celulares','cargador-inalambrico','telefono-inalambrico']
  },

  'climatizacion': {
    nombre: 'Climatización',
    icono:  'climate_mini_split',
    slugs: [
      'aire-acondicionado-split','aire-acondicionado-portatil','aire-acondicionado-de-ventana',
      'calefactor-a-gas','calefactor-electrico','calefactor-electrico-externo',
      'caloventor','convector','estufa-electrica','hogar-a-gas','placa-climatizadora','radiador'
    ]
  },

  'muebles': {
    nombre: 'Muebles',
    icono:  'chair',
    slugs: ['aparador','biblioteca','comoda','despensero','mesas-y-sillas','rack-de-microondas','rack-de-tv','ropero-placard']
  },

  'hogar': {
    nombre: 'Hogar',
    icono:  'bed',
    slugs: [
      'acolchado','almohada','colchon-espuma','colchon-resortes','respaldo-sommier','sommier',
      'almohadilla-termica','balanza-de-bano',
      'coche-de-bebe','silla-de-comer-para-bebes'
    ]
  },

  'electrodomesticos': {
    nombre: 'Electrodomésticos',
    icono:  'kitchen',
    slugs: [
      'cocina-a-gas','cocina-industrial',
      'freezer-bajo-mesada','freezer-horizontal','freezer-vertical',
      'heladera-bajo-mesada','heladera-con-freezer','heladera-no-frost',
      'lavarropas-automatico','lavarropas-automatico-linea-blanca-1',
      'lavarropas-semiautomatico','lavasecarropas-automatico',
      'lavavajilla','purificador-de-cocina',
      'calefon','termotanque-a-gas','termotanque-electrico',
      'notebook','impresora','tablet'
    ]
  },

  // ── PEQUEÑOS ELECTRODOMÉSTICOS ─────────────────────────────
  'pequenos': {
    nombre: 'Pequeños Electrodomésticos',
    icono:  'blender',
    slugs: [
      'abrelatas-electrico','anafe-electrico','aspiradora','aspiradora-de-mano',
      'balanza-de-cocina','batidora-de-mano','batidora-planetaria',
      'cafetera-de-filtro','cafetera-expresso','cortador-de-verduras',
      'cuchillo-electrico','espumador-de-leche','exprimidor-electrico',
      'freidora-con-aceite','freidora-sin-aceite','grill-electrico',
      'hamburguesera','juguera','licuadora-de-vaso','lustraspiradora',
      'maquina-de-coser','mixer','molinillo','panquequera','pava-electrica',
      'picadora','plancha-a-vapor','plancha-seca','pochoclera','procesadora',
      'rallador','sandwichera-electrica','sarten-electrica','sopera-electrica',
      'termo','tostadora','vaporiera-arrocera','waflera','yogurtera'
    ]
  },

  // ── SALUD Y CUIDADO PERSONAL ───────────────────────────────
  'salud': {
    nombre: 'Salud y Cuidado Personal',
    icono:  'health_and_safety',
    slugs: [
      'cepillo-alisador','cortabarba','cortapelo','depiladora-electrica',
      'nebulizador','planchita-para-el-cabello','repuesto-afeitadora',
      'rizador-para-el-cabello','secador-de-cabello','secador-voluminizador',
      'tensiometro-de-brazo','termometro','trimmer', 'afeitadora-femenina','afeitadora-masculina'
    ]
  }

};

// ============================================================
//  NOMBRES LEGIBLES POR SLUG
// ============================================================

const NOMBRES_SLUG = {
  'auricular':'Auriculares','minicomponente':'Minicomponentes','parlante':'Parlantes',
  'radio':'Radios','televisor':'Televisores',
  'telefono-celular':'Celulares','telefono-celular-telefonia':'Celulares',
  'celulares':'Celulares','cargador-inalambrico':'Cargadores inalámbricos',
  'telefono-inalambrico':'Teléfonos inalámbricos',
  'aire-acondicionado-split':'Aire acondicionado Split',
  'aire-acondicionado-portatil':'Aire acondicionado Portátil',
  'aire-acondicionado-de-ventana':'Aire acondicionado de ventana',
  'calefactor-a-gas':'Calefactores a gas','calefactor-electrico':'Calefactores eléctricos',
  'calefactor-electrico-externo':'Calefactores eléctricos externos',
  'caloventor':'Caloventores','convector':'Convectores','estufa-electrica':'Estufas eléctricas',
  'hogar-a-gas':'Hogares a gas','placa-climatizadora':'Placas climatizadoras','radiador':'Radiadores',
  'aparador':'Aparadores','biblioteca':'Bibliotecas','comoda':'Cómodas','despensero':'Despenseros',
  'mesas-y-sillas':'Mesas y sillas','rack-de-microondas':'Racks de microondas',
  'rack-de-tv':'Racks de TV','ropero-placard':'Roperos / Placards',
  'acolchado':'Acolchados','almohada':'Almohadas','colchon-espuma':'Colchones de espuma',
  'colchon-resortes':'Colchones de resortes','respaldo-sommier':'Respaldos de sommier',
  'sommier':'Sommiers','afeitadora-femenina':'Afeitadoras femeninas',
  'afeitadora-masculina':'Afeitadoras masculinas','almohadilla-termica':'Almohadillas térmicas',
  'balanza-de-bano':'Balanzas de baño','coche-de-bebe':'Coches de bebé',
  'silla-de-comer-para-bebes':'Sillas para bebé',
  'cocina-a-gas':'Cocinas a gas','cocina-industrial':'Cocinas industriales',
  'freezer-bajo-mesada':'Freezers bajo mesada','freezer-horizontal':'Freezers horizontales',
  'freezer-vertical':'Freezers verticales','heladera-bajo-mesada':'Heladeras bajo mesada',
  'heladera-con-freezer':'Heladeras con freezer','heladera-no-frost':'Heladeras No Frost',
  'lavarropas-automatico':'Lavarropas automáticos',
  'lavarropas-automatico-linea-blanca-1':'Lavarropas automáticos',
  'lavarropas-semiautomatico':'Lavarropas semiautomáticos',
  'lavasecarropas-automatico':'Lavasecarropas','lavavajilla':'Lavavajillas',
  'purificador-de-cocina':'Purificadores de cocina','calefon':'Calefones',
  'termotanque-a-gas':'Termotanques a gas','termotanque-electrico':'Termotanques eléctricos',
  'notebook':'Notebooks','impresora':'Impresoras','tablet':'Tablets',
  'abrelatas-electrico':'Abrelatas eléctricos','anafe-electrico':'Anafes eléctricos',
  'aspiradora':'Aspiradoras','aspiradora-de-mano':'Aspiradoras de mano',
  'balanza-de-cocina':'Balanzas de cocina','batidora-de-mano':'Batidoras de mano',
  'batidora-planetaria':'Batidoras planetarias','cafetera-de-filtro':'Cafeteras de filtro',
  'cafetera-expresso':'Cafeteras espresso','cortador-de-verduras':'Cortadores de verduras',
  'cuchillo-electrico':'Cuchillos eléctricos','espumador-de-leche':'Espumadores de leche',
  'exprimidor-electrico':'Exprimidores eléctricos','freidora-con-aceite':'Freidoras con aceite',
  'freidora-sin-aceite':'Freidoras sin aceite (Air Fryer)','grill-electrico':'Grills eléctricos',
  'hamburguesera':'Hamburgueseras','juguera':'Jugueras','licuadora-de-vaso':'Licuadoras',
  'lustraspiradora':'Lustraspiradoras','maquina-de-coser':'Máquinas de coser',
  'mixer':'Mixers','molinillo':'Molinillos','panquequera':'Panquequeras',
  'pava-electrica':'Pavas eléctricas','picadora':'Picadoras',
  'plancha-a-vapor':'Planchas a vapor','plancha-seca':'Planchas secas',
  'pochoclera':'Pochocleras','procesadora':'Procesadoras','rallador':'Ralladores',
  'sandwichera-electrica':'Sandwicheras','sarten-electrica':'Sartenes eléctricas',
  'sopera-electrica':'Soperas eléctricas','termo':'Termos','tostadora':'Tostadoras',
  'vaporiera-arrocera':'Vaporieras / Arroceras','waflera':'Wafleras','yogurtera':'Yogurteras',
  'cepillo-alisador':'Cepillos alisadores','cortabarba':'Cortabarbas','cortapelo':'Cortapelos',
  'depiladora-electrica':'Depiladoras eléctricas','nebulizador':'Nebulizadores',
  'planchita-para-el-cabello':'Planchas para cabello','repuesto-afeitadora':'Repuestos de afeitadora',
  'rizador-para-el-cabello':'Rizadores','secador-de-cabello':'Secadores de cabello',
  'secador-voluminizador':'Secador + Voluminizador','tensiometro-de-brazo':'Tensiómetros',
  'termometro':'Termómetros','trimmer':'Trimmers'
};

// ============================================================
//  PARÁMETRO ?cat= DE LA URL
// ============================================================

const paramsCat  = new URLSearchParams(window.location.search);
const catSlugURL = (paramsCat.get('cat') || '').toLowerCase().trim();

let todosLosResultados   = [];
let subcategoriasActivas = new Set();

// ============================================================
//  PARSEAR DESCRIPCIÓN
// ============================================================

function parsearDescCat(html) {
  if (!html) return { descripcion: '' };
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const sepIdx = tmp.innerHTML.search(/Caracter[ií]sticas\s*:/i);
  let descripcion = '';
  if (sepIdx !== -1) {
    const d = document.createElement('div');
    d.innerHTML = tmp.innerHTML.substring(0, sepIdx);
    descripcion = (d.textContent || '').replace(/^Descripci[oó]n\s*corta\s*:\s*/i, '').trim();
  } else {
    descripcion = (tmp.textContent || '').replace(/^Descripci[oó]n\s*corta\s*:\s*/i, '').trim();
  }
  return { descripcion };
}

// ============================================================
//  MAPEAR PRODUCTO
// ============================================================

function mapearProductoCat(p) {
  const precio  = parseInt(p.prices?.regular_price ?? '0', 10);
  const preciof = parseInt(p.prices?.sale_price) || 0;
  const imagen  = p.images?.[0]?.src ?? 'placeholder.jpg';
  const stock   = p.stock_quantity;
  const cats    = p.categories ?? [];
  let categoria = 'otros';
  if (cats.length > 0) {
    const sinOferta     = cats.filter(c => c.slug !== 'oferta');
    const catsFinal     = sinOferta.length > 0 ? sinOferta : cats;
    const masEspecifica = [...catsFinal].sort((a, b) => b.id - a.id)[0];
    categoria = masEspecifica.slug;
  }
  const { descripcion } = parsearDescCat(p.description || p.short_description || '');
  return { id: String(p.id), nombre: p.name ?? 'Producto sin nombre', precio, preciof, imagen, categoria, descripcion, stock };
}

// ============================================================
//  FETCH CON CACHÉ
// ============================================================

async function fetchProductosCat() {
  if (window.productosDB && window.productosDB_version === CAT_CACHE_VER) return window.productosDB;
  try {
    const cache = sessionStorage.getItem(CAT_CACHE_KEY);
    if (cache) {
      const parsed = JSON.parse(cache);
      window.productosDB = parsed;
      window.productosDB_version = CAT_CACHE_VER;
      return parsed;
    }
  } catch (e) {}
  const response = await fetch(CAT_API_URL);
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  const data  = await response.json();
  const items = Array.isArray(data) ? data : (data.products ?? []);
  const productos = items.map(mapearProductoCat);
  window.productosDB = productos;
  window.productosDB_version = CAT_CACHE_VER;
  try { sessionStorage.setItem(CAT_CACHE_KEY, JSON.stringify(productos)); } catch (e) {}
  return productos;
}

// ============================================================
//  RENDERIZAR CARD
// ============================================================

function renderCardCat(producto, nombreCategoria) {
  const descripcionCorta = producto.descripcion
    ? (producto.descripcion.length > 100 ? producto.descripcion.substring(0, 100) + '...' : producto.descripcion)
    : 'Producto disponible en Positivo Hogar';

  let precioHTML = `<strong class="only_product_precio precio_busqueda">$${producto.precio.toLocaleString('es-AR')}</strong>`;
  if (producto.preciof && producto.preciof !== producto.precio) {
    precioHTML = `
      <div>
        <strong class="only_product_precio tachado precio_busqueda">$${producto.precio.toLocaleString('es-AR')}</strong>
        <strong class="only_product_precio precio_busqueda">$${producto.preciof.toLocaleString('es-AR')}</strong>
      </div>`;
  }

  const card = document.createElement('a');
  card.href      = `muestra-producto.html?id=${producto.id}`;
  card.className = 'resultado_card';
  card.innerHTML = `
    <img src="${producto.imagen}" alt="${producto.nombre}" class="resultado_imagen" loading="lazy">
    ${precioHTML}
    <div class="resultado_categoria">${NOMBRES_SLUG[producto.categoria] || nombreCategoria}</div>
    <h3 class="resultado_nombre">${producto.nombre}</h3>
    <p class="resultado_descripcion">${descripcionCorta}</p>
  `;
  return card;
}

// ============================================================
//  CONSTRUIR SIDEBAR
// ============================================================

function construirSidebar(subcategoriasPresentes) {
  const sidebar = document.getElementById('cat-sidebar');
  if (!sidebar) return;

  const nombresUnicos = new Map();
  subcategoriasPresentes.forEach(slug => {
    const nombre = NOMBRES_SLUG[slug] || slug;
    if (!nombresUnicos.has(nombre)) nombresUnicos.set(nombre, []);
    nombresUnicos.get(nombre).push(slug);
  });

  const entradas = [...nombresUnicos.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));

  let html = `
    <div class="sidebar_header">
      <span class="material-symbols-outlined sidebar_header_icon">filter_list</span>
      <h3 class="sidebar_titulo">Subcategorías</h3>
    </div>
    <ul class="sidebar_lista">
      <li class="sidebar_item">
        <label class="sidebar_label sidebar_label_todas">
          <input type="radio" name="subcat" value="todas" class="sidebar_radio" checked>
          <span class="sidebar_check_custom"></span>
          Todas (${todosLosResultados.length})
        </label>
      </li>`;

  entradas.forEach(([nombre, slugs]) => {
    const count = todosLosResultados.filter(p => slugs.includes(p.categoria)).length;
    if (count === 0) return;
    html += `
      <li class="sidebar_item">
        <label class="sidebar_label">
          <input type="radio" name="subcat" value="${slugs.join(',')}" class="sidebar_radio">
          <span class="sidebar_check_custom"></span>
          ${nombre} <span class="sidebar_count">(${count})</span>
        </label>
      </li>`;
  });

  html += `</ul>`;
  sidebar.innerHTML = html;

  sidebar.querySelectorAll('.sidebar_radio').forEach(radio => {
    radio.addEventListener('change', () => {
      subcategoriasActivas = radio.value === 'todas' ? new Set() : new Set(radio.value.split(','));
      renderizarProductos(
        document.querySelector('.busqueda_info'),
        document.getElementById('resultados'),
        document.getElementById('sin-resultados')
      );
    });
  });

  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('sidebar_open'));
  }
}

// ============================================================
//  RENDERIZAR PRODUCTOS
// ============================================================

function renderizarProductos(info, contenedor, sinResultados) {
  let productos = subcategoriasActivas.size > 0
    ? todosLosResultados.filter(p => subcategoriasActivas.has(p.categoria))
    : todosLosResultados;

  productos = [...productos].sort((a, b) => {
    const catCmp = a.categoria.localeCompare(b.categoria, 'es');
    return catCmp !== 0 ? catCmp : a.precio - b.precio;
  });

  const catConfig = CATEGORIAS_PAGINA[catSlugURL];
  const nombreCat = catConfig ? catConfig.nombre : catSlugURL;

  if (productos.length === 0) {
    if (info) info.textContent = '';
    contenedor.style.display    = 'none';
    sinResultados.style.display = 'block';
    return;
  }

  if (info) info.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`;
  contenedor.style.display    = 'grid';
  sinResultados.style.display = 'none';
  contenedor.innerHTML = '';
  productos.forEach(p => contenedor.appendChild(renderCardCat(p, nombreCat)));
}

// ============================================================
//  FUNCIÓN PRINCIPAL
// ============================================================

async function cargarCategoriaPagina() {
  const contenedor    = document.getElementById('resultados');
  const sinResultados = document.getElementById('sin-resultados');
  const titulo        = document.querySelector('.busqueda_titulo');
  const info          = document.querySelector('.busqueda_info');

  const catConfig = CATEGORIAS_PAGINA[catSlugURL];

  if (!catConfig) {
    if (titulo) titulo.textContent = 'Categoría no encontrada';
    if (contenedor)    contenedor.style.display    = 'none';
    if (sinResultados) sinResultados.style.display = 'block';
    return;
  }

  document.title = `${catConfig.nombre} - Positivo Hogar`;
  if (titulo) titulo.textContent = catConfig.nombre;

  if (contenedor) {
    contenedor.innerHTML = '<div class="loader"><div class="spinner"></div><p>Cargando productos...</p></div>';
    contenedor.style.display = 'grid';
  }
  if (sinResultados) sinResultados.style.display = 'none';

  try {
    const productos = await fetchProductosCat();

    console.log('📋 Slugs reales en la API:', [...new Set(productos.map(p => p.categoria))].sort());

    const slugsSet = new Set(catConfig.slugs.map(s => s.toLowerCase()));
    todosLosResultados = productos.filter(p => {
      if (p.stock !== null && p.stock <= 0) return false;
      return slugsSet.has(p.categoria.toLowerCase());
    });

    if (todosLosResultados.length === 0) {
      if (info) info.textContent = '';
      contenedor.style.display    = 'none';
      sinResultados.style.display = 'block';
      return;
    }

    const subcategoriasPresentes = [...new Set(todosLosResultados.map(p => p.categoria))].sort();
    construirSidebar(subcategoriasPresentes);
    renderizarProductos(info, contenedor, sinResultados);

  } catch (err) {
    console.error('❌ Error cargando categoría:', err);
    if (titulo) titulo.textContent = 'Error al cargar productos';
    if (info)   info.textContent   = 'No se pudo conectar. Intentá más tarde.';
    if (contenedor)    contenedor.style.display    = 'none';
    if (sinResultados) sinResultados.style.display = 'block';
  }
}

window.addEventListener('DOMContentLoaded', cargarCategoriaPagina);