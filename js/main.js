// ============================================================
//  CONFIGURACIÓN DE LA API
// ============================================================

const WC_API_URL = 'https://positivohogar.com.ar/api/wp-json/positivo/v1/products';
const WC_PER_PAGE = 100;
const CACHE_VERSION = 'v12';


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
    const numeroLasFlores = '5491132330738';
    const numeroMitre     = '5491132904840';

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
//  SLIDER DE BANNERS PRINCIPAL
// ============================================================

function inicializarSliderBanners() {
  const bannerContainer = document.querySelector('.banner_container');
  if (!bannerContainer) return;

  // HTML del slider
  bannerContainer.innerHTML = `
    <div class="ph_slider" id="ph_slider">

      <div class="ph_slider_track" id="ph_track">

      <!-- ── SLIDE 0: banner original ── -->
        <div class="ph_slide ph_slide_img">
          <img src="./assets/banners/banner_principal_1920x400.webp" alt="Positivo Hogar">
        </div>

       <!-- ── SLIDE 1: Los mejores precios - Personas ── -->
        <div class="ph_slide" style="background:linear-gradient(105deg,#e85500 0%,#ff7200 35%,#ff8c1a 60%,#e85000 100%);overflow:hidden">
          <!-- hex pattern -->
          <div style="position:absolute;inset:0;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%23fff' stroke-width='1.5'/%3E%3C/svg%3E");background-size:60px 52px"></div>
          <!-- círculos deco -->
          <div style="position:absolute;top:-40%;right:30%;width:25%;aspect-ratio:1;border-radius:50%;border:2.5vw solid rgba(255,255,255,.06)"></div>
          <div style="position:absolute;top:-25%;left:-4%;width:19%;aspect-ratio:1;border-radius:50%;border:2vw solid rgba(255,255,255,.05)"></div>
          <!-- líneas diagonales -->
          <div style="position:absolute;inset:0;opacity:.05;background:repeating-linear-gradient(-55deg,transparent 0,transparent 18px,#fff 18px,#fff 20px)"></div>
          <!-- imagen personas: ocupa el lado derecho y se funde -->
          <div style="position:absolute;right:0;top:0;bottom:0;width:46%;overflow:hidden;z-index:1">
            <div style="position:absolute;top:0;bottom:0;left:0;width:42%;background:linear-gradient(90deg,#f07200 0%,rgba(240,114,0,0) 100%);z-index:2"></div>
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(232,85,0,.28) 0%,transparent 18%,transparent 80%,rgba(232,85,0,.28) 100%);z-index:2"></div>
            <img src="assets/banners/banner_principal.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block;">
          </div>
          <!-- SVG patrones -->
          <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.08;z-index:1" viewBox="0 0 1920 400" preserveAspectRatio="xMidYMid slice">
            <polygon points="580,40 620,110 580,180 540,110" fill="none" stroke="white" stroke-width="1.5"/>
            <polygon points="580,65 610,110 580,155 550,110" fill="none" stroke="white" stroke-width="1"/>
            <polygon points="300,60 320,100 280,100" fill="rgba(255,255,255,.45)"/>
            <polygon points="700,310 720,350 680,350" fill="rgba(255,255,255,.35)"/>
            <line x1="440" y1="28" x2="440" y2="78" stroke="white" stroke-width="2" opacity=".28"/>
            <circle cx="580" cy="200" r="140" fill="none" stroke="white" stroke-width="1" opacity=".4"/>
            <circle cx="580" cy="200" r="190" fill="none" stroke="white" stroke-width=".5" opacity=".25"/>
          </svg>
          <!-- texto lado izquierdo -->
          <div style="position:relative;z-index:10;width:58%;display:flex;flex-direction:column;justify-content:center;padding:0 0 0 5%;gap:3%">
            <span style="font-size:.68vw;font-weight:700;color:rgba(255,255,255,.72);letter-spacing:.3em;text-transform:uppercase">Electrodomésticos</span>
            <div style="font-size:4.6vw;font-weight:900;color:#fff;line-height:.88;text-transform:uppercase;letter-spacing:-.1em;text-shadow:0 4px 24px rgba(0,0,0,.18)">Los mejores<br>precios</div>
            <div style="width:3.75%;height:5px;background:rgba(255,255,255,.55);border-radius:3px"></div>
            <div style="font-size:1.68vw;font-weight:800;color:rgba(255,255,255,.88);text-transform:uppercase;letter-spacing:.16em;text-shadow:0 2px 12px rgba(0,0,0,.15)">Los encontrás en</div>
            <div style="display:inline-flex;align-items:center;gap:.6vw;background:rgba(0,0,0,.18);border:2px solid rgba(255,255,255,.35);border-radius:50px;padding:.5vw 1.25vw;width:fit-content">
              <div style="width:.52vw;height:.52vw;min-width:7px;min-height:7px;border-radius:50%;background:#ffe066;flex-shrink:0"></div>
              <span style="font-size:.78vw;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.16em">Positivo Hogar</span>
              <div style="width:.52vw;height:.52vw;min-width:7px;min-height:7px;border-radius:50%;background:#ffe066;flex-shrink:0"></div>
            </div>
          </div>
        </div>

        <!-- ── SLIDE 2: Crédito al instante ── -->
        <div class="ph_slide ph_slide_orange">
          <div class="ph_slide_overlay"></div>
          <div class="ph_slide_inner">
            <div class="ph_slide_left">
              <span class="ph_tag">Positivo Hogar</span>
              <div class="ph_title">Crédito<br><span class="ac">al instante</span></div>
              <div class="ph_sub">Aprobación en el momento</div>
              <div class="ph_dni_badge">
                <div class="ph_dni_icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="10" x2="12" y2="10"/><line x1="7" y1="13" x2="10" y2="13"/><circle cx="16" cy="11" r="2"/><line x1="14" y1="15" x2="18" y2="15"/></svg></div>
                <div class="ph_dni_txt">Solo necesitás tu <span>DNI</span></div>
              </div>
            </div>
            <div class="ph_slide_right">
              <div class="ph_appr">
                <div class="ph_app">
                  <svg width="7vw" height="13vw" style="min-width:55px;min-height:95px;max-width:130px;max-height:245px" viewBox="0 0 82 145" fill="none"><rect x="3" y="3" width="76" height="52" rx="7" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><rect x="3" y="57" width="76" height="82" rx="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><rect x="3" y="53" width="76" height="6" fill="rgba(255,255,255,0.15)"/><rect x="62" y="20" width="7" height="20" rx="3" fill="rgba(255,255,255,0.75)"/><rect x="62" y="72" width="7" height="32" rx="3" fill="rgba(255,255,255,0.75)"/><line x1="14" y1="92" x2="56" y2="92" stroke="rgba(255,255,255,0.22)" stroke-width="1.2" stroke-dasharray="4 3"/><line x1="14" y1="110" x2="56" y2="110" stroke="rgba(255,255,255,0.22)" stroke-width="1.2" stroke-dasharray="4 3"/><rect x="10" y="137" width="12" height="8" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="60" y="137" width="12" height="8" rx="2" fill="rgba(255,255,255,0.4)"/></svg>
                  <span class="ph_albl">Heladera</span>
                </div>
                <div class="ph_app">
                  <svg width="11vw" height="9.5vw" style="min-width:85px;min-height:70px;max-width:200px;max-height:175px" viewBox="0 0 140 110" fill="none"><rect x="3" y="3" width="134" height="82" rx="7" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><rect x="9" y="9" width="122" height="70" rx="4" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/><rect x="60" y="85" width="20" height="14" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="36" y="99" width="68" height="9" rx="4" fill="rgba(255,255,255,0.3)"/><circle cx="128" cy="78" r="4" fill="rgba(255,230,102,0.9)"/></svg>
                  <span class="ph_albl">Televisor</span>
                </div>
                <div class="ph_app">
                  <svg width="6.5vw" height="11vw" style="min-width:50px;min-height:80px;max-width:120px;max-height:200px" viewBox="0 0 88 126" fill="none"><rect x="3" y="10" width="82" height="110" rx="9" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><rect x="3" y="10" width="82" height="24" rx="9" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><rect x="3" y="24" width="82" height="10" fill="rgba(255,255,255,0.18)"/><circle cx="18" cy="22" r="5" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/><circle cx="32" cy="22" r="5" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/><circle cx="44" cy="76" r="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.75)" stroke-width="2"/><circle cx="44" cy="76" r="19" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"/><rect x="14" y="118" width="14" height="8" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="60" y="118" width="14" height="8" rx="2" fill="rgba(255,255,255,0.4)"/></svg>
                  <span class="ph_albl">Lavarropas</span>
                </div>
                <div class="ph_app">
                  <svg width="9vw" height="5.5vw" style="min-width:70px;min-height:42px;max-width:165px;max-height:100px" viewBox="0 0 130 80" fill="none"><rect x="3" y="3" width="124" height="58" rx="11" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><rect x="9" y="9" width="112" height="16" rx="5" fill="rgba(255,255,255,0.08)"/><line x1="10" y1="38" x2="120" y2="38" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/><line x1="10" y1="44" x2="120" y2="44" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/><line x1="10" y1="50" x2="120" y2="50" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><circle cx="18" cy="17" r="4" fill="rgba(255,230,102,0.9)"/><rect x="3" y="59" width="124" height="12" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/></svg>
                  <span class="ph_albl">Aire acond.</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div><!-- /track -->

      <!-- Flechas -->
      <button class="ph_arrow pv" id="ph_prev"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
      <button class="ph_arrow nx" id="ph_next"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>

      <!-- Dots -->
      <div class="ph_dots" id="ph_dots">
        <button class="ph_dot on"></button>
        <button class="ph_dot"></button>
        <button class="ph_dot"></button>  
      </div>

    </div><!-- /slider -->
  `;

  // Lógica del slider
  const track         = document.getElementById('ph_track');
  const dotsContainer = document.getElementById('ph_dots');
  const isMobile      = window.innerWidth < 768;

  // En móvil: eliminar slide 0 del DOM y ajustar dots a 2
  if (isMobile) {
    const slide0 = track.querySelector('.ph_slide_img');
    if (slide0) slide0.remove();
    dotsContainer.innerHTML = `
      <button class="ph_dot on"></button>
      <button class="ph_dot"></button>
    `;
  }

  const dots  = dotsContainer.querySelectorAll('.ph_dot');
  const total = isMobile ? 2 : 3;
  let cur     = 0;
  let timer   = null;

  function goTo(n) {
    cur = ((n % total) + total) % total;
    track.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('on', i === cur));
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 4500);
  }

  document.getElementById('ph_prev').addEventListener('click', () => { goTo(cur - 1); startTimer(); });
  document.getElementById('ph_next').addEventListener('click', () => { goTo(cur + 1); startTimer(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); startTimer(); }));

  // Swipe táctil
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? cur + 1 : cur - 1); startTimer(); }
  }, { passive: true });

  startTimer();
}


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

    // Inicializar slider de banners
    inicializarSliderBanners();

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