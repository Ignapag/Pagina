// ============================================================
//  CONFIGURACIÓN DE LA API
// ============================================================

const WC_API_URL = 'https://olivedrab-deer-648705.hostingersite.com/api/wp-json/positivo/v1/products';
const WC_PER_PAGE = 100;
const CACHE_VERSION = 'v10';


// ============================================================
//  CATEGORÍAS VISIBLES EN EL MAIN
// ============================================================
const SUBCATEGORIAS = {
  'aire': [
    'aire-acondicionado-split',
    'aire-acondicionado-portatil',
    'aire-acondicionado-de-ventana',
    'aire-acondicionado-split-linea-blanca-1' // por si acaso
  ],
  'heladeras': [
    'heladera-no-frost',
    'heladera-con-freezer',
    'heladera-bajo-mesada'
  ],
  'lavarropas': [
    'lavarropas-automatico',
    'lavarropas-automatico-linea-blanca-1',
    'lavarropas-semiautomatico'
  ],
  'cocina': [
    'cocina-a-gas',
    'cocina-industrial'
  ],
  'afeitadora': [
    'afeitadora-masculina',
    'afeitadora-femenina'
  ],
  'colchones':[
   'colchon-resortes',
   'colchon-espuma'
  ],
  'celular':[
   'telefono-celular-telefonia',
   'celulares'
  ],
  'estanteria':[
   'rack-de-tv',
   'rack-de-microondas',
   'despensero',
   'comoda',
   'biblioteca'
  ]

};

const CATEGORIAS_VISIBLES_MAIN = [
  'televisor',
  'aire',
  'lavarropas',
  'cocina',
  'heladeras',
  'celular',
  'parlante'   
];

const NOMBRES_CATEGORIAS = {
  'televisor':            'Televisores',
  'aire':            'Aire acondicionado',
  'lavarropas':  'Lavarropas',
  'cocina': 'Cocinas',
  'heladeras':  'Heladeras',
  'celular' : 'Celulares',
  'parlante' : 'Parlantes'
};



// ============================================================
//  FUNCIONES AUXILIARES
// ============================================================

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearPrecio(precio) {
  return precio.toLocaleString('es-AR');
}

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
//  MAPEO UNIFICADO (categorías + ofertas en un solo objeto)
// ============================================================

function mapearProductoWC(p) {
  const precioRaw = parseInt(p.prices?.regular_price ?? '0', 10);
  const precio    = precioRaw;
  const precioRegular = parseInt(p.prices?.regular_price ?? '0', 10);
  const preciof   = parseInt(p.prices?.sale_price) || 0;
  const stock = p.stock_quantity;
  const imagen = p.images?.[0]?.src ?? 'placeholder.jpg';

  const cats = p.categories ?? [];
  let categoria = 'otros';
  let esOferta = false;

  if (cats.length > 0) {
    esOferta = cats.some(c => c.slug === 'oferta');
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
    precioRegular,
    preciof,
    imagen,
    categoria,
    esOferta,
    descripcion,
    caracteristicas,
    _slug:          p.slug ?? '',
    stock
  };
}


// ============================================================
//  FETCH ÚNICO CON CACHÉ EN sessionStorage
// ============================================================

async function fetchTodosLosProductos() {
  console.log('🔄 fetchTodosLosProductos() llamada');

  // 1) Si ya está en memoria Y es de la versión correcta, devolver directo
  if (window.productosDB && window.productosDB_version === CACHE_VERSION) {
    console.log('✅ Devolviendo desde memoria:', window.productosDB.length, 'productos');
    return window.productosDB;
  }

  // 2) Intentar cargar desde sessionStorage
  try {
    const cache = sessionStorage.getItem('productosDB_' + CACHE_VERSION);
    if (cache) {
      window.productosDB = JSON.parse(cache);
      console.log('✅ Devolviendo desde sessionStorage:', window.productosDB.length, 'productos');
      return window.productosDB;
    } else {
      console.log('ℹ️ No hay caché en sessionStorage para versión:', CACHE_VERSION);
    }
  } catch (e) {
    console.warn('⚠️ Error leyendo caché:', e);
  }

  // 3) Descargar desde la API (una sola petición, devuelve todo)
  console.log('⏳ Descargando desde API:', WC_API_URL);
  try {
    const url      = WC_API_URL;
    const response = await fetch(url);

    console.log('📡 Response status:', response.status);

    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

    const data  = await response.json();
    console.log('📦 Data recibida, tipo:', typeof data, 'isArray:', Array.isArray(data));
    
    const items = Array.isArray(data) ? data : (data.products ?? []);
    console.log('📋 Items a mapear:', items.length);
    
    const productos = items.map(mapearProductoWC);
    console.log('✅ Productos mapeados:', productos.length);

    // 4) Guardar en memoria y en sessionStorage
    window.productosDB = productos;
    window.productosDB_version = CACHE_VERSION;
    try {
      sessionStorage.setItem('productosDB_' + CACHE_VERSION, JSON.stringify(productos));
      console.log('💾 Guardado en sessionStorage');
    } catch (e) {
      console.warn('⚠️ No se pudo guardar en sessionStorage:', e);
    }

    return productos;
  } catch (e) {
    console.error('❌ Error descargando productos:', e);
    throw e;
  }
}


// ============================================================
//  SLIDERS
// ============================================================

function inicializarSlidersNuevos() {
  document.querySelectorAll('.main_product_transition').forEach(slider => {
    const track    = slider.querySelector('.main_product_container');
    const btnLeft  = slider.querySelector('.main_desktop__product_buttom.left');
    const btnRight = slider.querySelector('.main_desktop__product_buttom.right');

    if (!track || !btnLeft || !btnRight) return;

    btnLeft.addEventListener('click', () => {
      const cards         = Array.from(track.querySelectorAll('.product_card'));
      const containerRect = track.getBoundingClientRect();
      const visibleCards  = cards.filter(c => c.getBoundingClientRect().left >= containerRect.left - 10);
      const currentIndex  = cards.indexOf(visibleCards[0]);
      const targetCard    = cards[Math.max(0, currentIndex - 1)];
      if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });

    btnRight.addEventListener('click', () => {
      const cards         = Array.from(track.querySelectorAll('.product_card'));
      const containerRect = track.getBoundingClientRect();
      const visibleCards  = cards.filter(c => c.getBoundingClientRect().left >= containerRect.left - 10);
      const currentIndex  = cards.indexOf(visibleCards[0]);
      const targetCard    = cards[Math.min(cards.length - 1, currentIndex + 1)];
      if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  });
}


// ============================================================
//  CARGAR TODAS LAS CATEGORÍAS + OFERTAS (una sola descarga)
// ============================================================

async function cargarTodasLasCategorias() {
  console.log('🔄 cargarTodasLasCategorias() llamada');

  try {
    const productos = await fetchTodosLosProductos();
    console.log('📦 Productos recibidos en cargarTodasLasCategorias:', productos.length);

    // --- CATEGORÍAS ---
    const productosPorCategoria = {};
    const productosOfertas = [];

    productos.forEach(producto => {
      // ✅ Ocultar productos sin stock
      if (producto.stock === 0) return;

      const cat = producto.categoria.toLowerCase();
      
      // Ofertas
      if (producto.esOferta) {
        productosOfertas.push(producto);
      }

      // Categorías visibles
      let categoriaDestino = null;
      
      if (CATEGORIAS_VISIBLES_MAIN.includes(cat)) {
        categoriaDestino = cat;
      } else {
        for (const [catPrincipal, subs] of Object.entries(SUBCATEGORIAS)) {
          if (subs.includes(cat)) {
            categoriaDestino = catPrincipal;
            break;
          }
        }
      }
      
      if (categoriaDestino) {
        if (!productosPorCategoria[categoriaDestino]) productosPorCategoria[categoriaDestino] = [];
        productosPorCategoria[categoriaDestino].push(producto);
      }
    });

    const mainContainer = document.querySelector('.main_container');
    if (!mainContainer) { console.error('❌ No se encontró .main_container'); return; }

    console.log('📊 Productos por categoría:', Object.keys(productosPorCategoria).map(k => k + ': ' + productosPorCategoria[k].length));
    console.log('📊 Ofertas:', productosOfertas.length);
    console.log('📊 mainContainer encontrado:', !!mainContainer);

    mainContainer.style.marginTop = '0px';

    const bannerContainer = document.querySelector('.banner_container');
    if (bannerContainer) bannerContainer.style.display = 'flex';

    mainContainer.innerHTML = '';

    CATEGORIAS_VISIBLES_MAIN.forEach(categoriaVisible => {
      const prods = productosPorCategoria[categoriaVisible];
      if (!prods || prods.length === 0) return;

      prods.sort((a, b) => a.precio - b.precio);

      const nombreVisible = NOMBRES_CATEGORIAS[categoriaVisible] || capitalizar(categoriaVisible.replace(/-/g, ' '));

      const seccion = document.createElement('section');
      seccion.className = 'main_product_transition';
      seccion.id = categoriaVisible;

      seccion.innerHTML = `
        <button class="main_desktop__product_buttom left main_desktop" aria-label="Anterior">
          <span class="material-symbols-outlined left">chevron_left</span>
        </button>
        <div class="main_product_container">
          <h3 class="main_product_show_tittle_secundary main_desktop">${nombreVisible}</h3>
          <section class="main_product_show aire desktop" id="${nombreVisible.toLowerCase().replace(/\s+/g, '-')}">
            <h3 class="main_product_show_tittle_secundary main_phone"">${nombreVisible}</h3>
            <div class="main_product_show_list">
              ${prods.map(producto => {
                let precioHTML = `<strong class="main_product_price">$${formatearPrecio(producto.precio)}</strong>`;
                if (producto.preciof && producto.preciof !== producto.precio) {
                  precioHTML = `<strong class="main_product_price tachado">$${formatearPrecio(producto.precio)}</strong>
                  <strong class="main_product_price">$${formatearPrecio(producto.preciof)}</strong>`;
                }
                return `
                <a href="./muestra-producto.html?id=${producto.id}" class="main_product_show_a">
                  <article class="product_card">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy"/>
                    ${precioHTML}
                    <h4 class="producto_categoria">${nombreVisible}</h4>
                    <h3 class="product_name">${producto.nombre}</h3>
                  </article>
                </a>
              `}).join('')}
            </div>
          </section>
        </div>
        <button class="main_desktop__product_buttom right main_desktop" aria-label="Siguiente">
          <span class="material-symbols-outlined right">chevron_right</span>
        </button>
      `;

      mainContainer.appendChild(seccion);
    });

    // --- OFERTAS (usa los mismos datos, sin segunda descarga) ---
    const contenedorofertas = document.querySelector(".container-ofertas");
    if (contenedorofertas && productosOfertas.length > 0) {
      let productoind = productosOfertas.filter(p => p.preciof && p.preciof !== p.precioRegular).map(p => `
        <a href="./muestra-producto.html?id=${p.id}" class="main_product_show_a">
          <article class="product_card grande">
            <img src="${p.imagen}" alt="${p.nombre}" loading="lazy"/>
            <strong class="main_product_price tachado">$${formatearPrecio(p.precioRegular)}</strong>
            <strong class="main_product_price">$${formatearPrecio(p.preciof)}</strong>
            <h4 class="producto_categoria">${p.nombre}</h4>
            <h3 class="product_name">${p.nombre}</h3>
          </article>
        </a>
      `).join('');

      contenedorofertas.classList.add('main_product_transition');
      contenedorofertas.innerHTML = `
        <button class="main_desktop__product_buttom left main_desktop" aria-label="Anterior">
          <span class="material-symbols-outlined left">chevron_left</span>
        </button>
        <div class="main_product_container">
          <h3 class="main_product_show_tittle_secundary main_desktop titulo-ofertas">OFERTAS DEL MES</h3>
          <section class="main_product_show aire desktop">
            <h3 class="main_product_show_tittle_secundary main_phone">Ofertas</h3>
            <div class="main_product_show_list">
              ${productoind}
            </div>
          </section>
        </div>
        <button class="main_desktop__product_buttom right main_desktop" aria-label="Siguiente">
          <span class="material-symbols-outlined right">chevron_right</span>
        </button>
      `;
    }

    inicializarSlidersNuevos();

  } catch (error) {
    console.error('❌ Error cargando categorías:', error);
    const mainContainer = document.querySelector('.main_container');
    if (mainContainer) {
      mainContainer.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <span class="material-symbols-outlined" style="font-size:64px; color:#ff7700;">wifi_off</span>
          <h2 style="margin:20px 0; color:#333;">No se pudieron cargar los productos</h2>
          <p style="color:#666;">Por favor recargá la página o intentá más tarde.</p>
        </div>
      `;
    }
  }
}


// ============================================================
//  MOSTRAR SOLO UNA CATEGORÍA
// ============================================================

async function mostrarSoloCategoria(categoriaOriginal) {

  const isIndexPage = window.location.pathname === '/' ||
                      window.location.pathname.includes('index.html') ||
                      window.location.pathname.endsWith('/');
  if (!isIndexPage) {
    window.location.href = `index.html#${categoriaOriginal}`;
    return;
  }

  try {
    const bannerContainer = document.querySelector('.banner_container');
    if (bannerContainer) bannerContainer.style.display = 'none';

    const mainContainer = document.querySelector('.main_container');
    const contenedorofertas = document.querySelector('.container-ofertas');
    if (!mainContainer) { console.error("❌ No se encontró .main_container"); return; }

    mainContainer.style.marginTop = '80px';
    mainContainer.innerHTML = '<div class="loader"><div class="spinner"></div><p>Cargando productos...</p></div>';

    const productos = await fetchTodosLosProductos();

    const categoriaNormalizada = categoriaOriginal.toLowerCase().trim();
    
    const slugsAFiltrar = SUBCATEGORIAS[categoriaNormalizada] 
      ? SUBCATEGORIAS[categoriaNormalizada] 
      : [categoriaNormalizada];
    
    const productosCategoria = productos.filter(p =>
      slugsAFiltrar.includes(p.categoria.toLowerCase().trim()) &&
      p.stock !== 0 // ✅ Ocultar productos sin stock
    );


    productosCategoria.sort((a, b) => a.precio - b.precio);

    if (productosCategoria.length === 0) {
      mainContainer.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <span class="material-symbols-outlined" style="font-size:64px; color:#ff7700;">search_off</span>
          <h2 style="margin:20px 0; color:#333;">No hay productos en "${capitalizar(categoriaOriginal)}"</h2>
          <p style="color:#666; margin-bottom:20px;">Esta categoría no tiene productos disponibles actualmente.</p>
          <button onclick="cargarTodasLasCategorias()" style="
            padding:12px 24px; background:#ff7700; color:white;
            border:none; border-radius:8px; cursor:pointer;
            font-size:16px; font-weight:600;">Ver todas las categorías</button>
        </div>
      `;
      return;
    }

    mainContainer.innerHTML = '';
    if (contenedorofertas) {
      contenedorofertas.innerHTML = '';
      contenedorofertas.style.display = "none";
    }

    const nombreVisible = NOMBRES_CATEGORIAS[categoriaNormalizada] || capitalizar(categoriaOriginal.replace(/-/g, ' '));
    const seccion = document.createElement('section');
    seccion.className = 'main_product_transition';
    seccion.id = categoriaNormalizada;

    seccion.innerHTML = `
      <button class="main_desktop__product_buttom left main_desktop" aria-label="Anterior">
        <span class="material-symbols-outlined left">chevron_left</span>
      </button>
      <div class="main_product_container">
        <h3 class="main_product_show_tittle_secundary main_desktop">${nombreVisible}</h3>
        <section class="main_product_show aire desktop">
          <h3 class="main_product_show_tittle_secundary main_phone">${nombreVisible}</h3>
          <div class="main_product_show_list">
            ${productosCategoria.map(producto => {
              let precioHTML = `<strong class="main_product_price">$${formatearPrecio(producto.precio)}</strong>`;
              if (producto.preciof && producto.preciof !== producto.precio) {
                precioHTML = `<strong class="main_product_price tachado">$${formatearPrecio(producto.precio)}</strong>
                <strong class="main_product_price">$${formatearPrecio(producto.preciof)}</strong>`;
              }
              return `
              <a href="./muestra-producto.html?id=${producto.id}" class="main_product_show_a">
                <article class="product_card">
                  <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy"/>
                  ${precioHTML}
                  <h4 class="producto_categoria">${nombreVisible}</h4>
                  <h3 class="product_name">${producto.nombre}</h3>
                </article>
              </a>
            `}).join('')}
          </div>
        </section>
      </div>
      <button class="main_desktop__product_buttom right main_desktop" aria-label="Siguiente">
        <span class="material-symbols-outlined right">chevron_right</span>
      </button>
    `;

    mainContainer.appendChild(seccion);
    inicializarSlidersNuevos();
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error("❌ Error al mostrar categoría:", error);
  }
}


// ============================================================
//  BUSCADOR
// ============================================================

function inicializarBuscador() {
  const form  = document.querySelector(".search_bar_form");
  const input = document.querySelector(".search_bar_input");


  if (!form || !input) { console.error("❌ No se encontró el formulario o input"); return; }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    window.location.href = `busqueda.html?q=${encodeURIComponent(texto)}`;
  });

}


// ============================================================
//  DROPDOWNS
// ============================================================

function inicializarDropdown(btnId, menuId) {
  const dropdownBtn  = document.getElementById(btnId);
  const dropdownMenu = document.getElementById(menuId);

  if (!dropdownBtn || !dropdownMenu) {
    console.warn(`⚠️ Dropdown ${btnId} no encontrado`);
    return;
  }

  const dropdownArrow = dropdownBtn.querySelector('.dropdown-arrow');

  dropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
    if (dropdownArrow) dropdownArrow.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) dropdownArrow.classList.remove('open');
    }
  });

  dropdownMenu.querySelectorAll('.dropdown-item-electro').forEach(item => {
    item.addEventListener('click', async e => {
      e.preventDefault();
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) dropdownArrow.classList.remove('open');

      let categoria = item.getAttribute('data-categoria');
      if (!categoria) {
        const href = item.getAttribute('href') ?? '';
        categoria = href.split('#')[1] ?? '';
      }

      if (!categoria) {
        console.warn('⚠️ No se pudo determinar la categoría del item:', item);
        return;
      }

      await mostrarSoloCategoria(categoria);
    });
  });

}


// ============================================================
//  HEADER
// ============================================================

fetch("components/header.html?v=" + Date.now())
  .then(res => res.text())
  .then(data => {
    document.querySelectorAll('.nav_list_item_a').forEach(link => {
      link.addEventListener('click', async e => {
        const href = link.getAttribute('href') ?? '';
        const hash = href.split('#')[1];
        if (!hash) return;

        const isIndex = window.location.pathname === '/' ||
                        window.location.pathname.includes('index.html') ||
                        window.location.pathname.endsWith('/');

        if (isIndex) {
          e.preventDefault();
          document.querySelector('.nav')?.classList.remove('open');
          await mostrarSoloCategoria(hash);
        }
      });
    });
    document.getElementById("site-header").innerHTML = data;

    const btn      = document.querySelector('.menu_btn');
    const nav      = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav_list_item_a');

    if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('open'));
    navLinks.forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

    inicializarBuscador();

    const botonesWpp      = document.querySelectorAll('.whatsapp');
    const numeroLasFlores = '5491112345678';
    const numeroMitre     = '5491187654321';

    botonesWpp.forEach(boton => {
      const texto          = boton.textContent.toLowerCase();
      const numeroWhatsApp = texto.includes('mitre') ? numeroMitre : numeroLasFlores;
      const sucursal       = texto.includes('mitre') ? 'Mitre' : 'Las Flores';
      const mensajeCod     = encodeURIComponent(`Hola! Quisiera consultar sobre productos disponibles en sucursal ${sucursal}`);
      boton.href           = `https://wa.me/${numeroWhatsApp}?text=${mensajeCod}`;
      boton.target         = '_blank';
      boton.rel            = 'noopener noreferrer';
    });


    inicializarDropdown('dropdownElectro',  'menuElectro');
    inicializarDropdown('dropdownDescanso', 'menuDescanso');
    inicializarDropdown('dropdownMuebles',  'menuMuebles');
  })
  .catch(error => console.error("❌ Error cargando header:", error));


// ============================================================
//  FOOTER
// ============================================================

fetch("components/footer.html?v=" + Date.now())
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-footer").innerHTML = data;
  })
  .catch(error => console.error("❌ Error cargando footer:", error));


// ============================================================
//  MAIN (sin no-cache forzado)
// ============================================================

console.log('🚀 java.js cargado, CACHE_VERSION:', CACHE_VERSION);

fetch("components/main.html")
  .then(res => {
    console.log('📄 main.html response status:', res.status);
    return res.text();
  })
  .then(data => {
    const siteMain = document.getElementById("site-main");
    console.log('📄 site-main encontrado:', !!siteMain);
    if (siteMain) siteMain.innerHTML = data;

    const isIndexPage = window.location.pathname === '/' ||
                        window.location.pathname.includes('index.html') ||
                        window.location.pathname.endsWith('/');

    console.log('📄 isIndexPage:', isIndexPage, 'pathname:', window.location.pathname);

    if (isIndexPage) {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        console.log('🔗 Hash detectado:', hash);
        mostrarSoloCategoria(hash);
      } else {
        console.log('📋 Sin hash, llamando cargarTodasLasCategorias()');
        cargarTodasLasCategorias();
      }
    } else {
      console.log('⏭️ No es index, no se cargan categorías');
    }
  })
  .catch(error => console.error("❌ Error cargando main:", error));