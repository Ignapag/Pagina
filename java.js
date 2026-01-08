console.log("Java.js cargado");


// CONSTANTES

const CATEGORIAS_VISIBLES_MAIN = [
  'aires',
  'televisores', 
  'celulares',
  'lavarropas',
  'heladeras',
  'otros'
];


// FUNCIONES AUXILIARES

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearPrecio(precio) {
  return precio.toLocaleString('es-AR');
}

function inicializarSlidersNuevos() {
  document.querySelectorAll('.main_product_transition').forEach(slider => {
    const track = slider.querySelector('.main_product_container');
    const btnLeft = slider.querySelector('.main_desktop__product_buttom.left');
    const btnRight = slider.querySelector('.main_desktop__product_buttom.right');

    if (!track || !btnLeft || !btnRight) return;

    btnLeft.addEventListener('click', () => {
      const cards = Array.from(track.querySelectorAll('.product_card'));
      const containerRect = track.getBoundingClientRect();
      
      const visibleCards = cards.filter(card => {
        const cardRect = card.getBoundingClientRect();
        return cardRect.left >= containerRect.left - 10;
      });
      
      const currentIndex = cards.indexOf(visibleCards[0]);
      const targetCard = cards[Math.max(0, currentIndex - 1)];
      
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    });

    btnRight.addEventListener('click', () => {
      const cards = Array.from(track.querySelectorAll('.product_card'));
      const containerRect = track.getBoundingClientRect();
      
      const visibleCards = cards.filter(card => {
        const cardRect = card.getBoundingClientRect();
        return cardRect.left >= containerRect.left - 10;
      });
      
      const currentIndex = cards.indexOf(visibleCards[0]);
      const targetCard = cards[Math.min(cards.length - 1, currentIndex + 1)];
      
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    });
  });
}


// CARGAR TODAS LAS CATEGORÍAS VISIBLES

async function cargarTodasLasCategorias() {
  console.log('🔄 Iniciando carga de categorías...');
  
  try {
    const response = await fetch('productos-mock.json');
    
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    
    const data = await response.json();
    
    const productosPorCategoria = {};
    
    // Filtrar solo las categorías que deben mostrarse en el main
    data.productos.forEach(producto => {
      const categoriaLower = producto.categoria.toLowerCase();
      
      if (CATEGORIAS_VISIBLES_MAIN.includes(categoriaLower)) {
        if (!productosPorCategoria[producto.categoria]) {
          productosPorCategoria[producto.categoria] = [];
        }
        productosPorCategoria[producto.categoria].push(producto);
      }
    });
    
    const mainContainer = document.querySelector('.main_container');
    if (!mainContainer) {
      console.error('❌ No se encontró .main_container');
      return;
    }
    mainContainer.style.marginTop = '0px';
    // MOSTRAR EL BANNER cuando se cargan todas las categorías
    const bannerContainer = document.querySelector('.banner_container');
    if (bannerContainer) {
      bannerContainer.style.display = 'flex';
    }
    
    mainContainer.innerHTML = '';
    
    // Mostrar categorías en el orden definido
    CATEGORIAS_VISIBLES_MAIN.forEach(categoriaVisible => {
      const categoriaKey = Object.keys(productosPorCategoria).find(
        key => key.toLowerCase() === categoriaVisible
      );
      
      if (!categoriaKey) return;
      
      const productos = productosPorCategoria[categoriaKey];
      
      const seccion = document.createElement('section');
      seccion.className = 'main_product_transition';
      seccion.id = categoriaVisible;
      
      seccion.innerHTML = `
        <button class="main_desktop__product_buttom left main_desktop" aria-label="Anterior">
          <span class="material-symbols-outlined left">chevron_left</span>
        </button>
        
        <div class="main_product_container">
          <h3 class="main_product_show_tittle_secundary main_desktop">${capitalizar(categoriaKey)}</h3>
          <section class="main_product_show aire desktop">
            <h3 class="main_product_show_tittle_secundary main_phone">${capitalizar(categoriaKey)}</h3>
            <div class="main_product_show_list">
              ${productos.map(producto => `
                <a href="./muestra-producto.html?id=${producto.id}" class="main_product_show_a">
                  <article class="product_card">
                    <img src="${producto.imagen || 'placeholder.jpg'}" alt="${producto.nombre}"/>
                    <strong class="main_product_price">$${formatearPrecio(producto.precio)}</strong>
                    <h4 class="producto_categoria">${capitalizar(categoriaKey)}</h4>
                    <h3 class="product_name">${producto.nombre}</h3>
                  </article>
                </a>
              `).join('')}
            </div>
          </section>
        </div>
        
        <button class="main_desktop__product_buttom right main_desktop" aria-label="Siguiente">
          <span class="material-symbols-outlined right">chevron_right</span>
        </button>
      `;
      
      mainContainer.appendChild(seccion);
    });
    
    inicializarSlidersNuevos();
    
    console.log('✅ Categorías visibles cargadas:', CATEGORIAS_VISIBLES_MAIN);
    
  } catch (error) {
    console.error('❌ Error cargando categorías:', error);
  }
}


// MOSTRAR SOLO UNA CATEGORÍA

async function mostrarSoloCategoria(categoriaOriginal) {
  console.log("📂 Intentando mostrar categoría:", categoriaOriginal);
  
  const isIndexPage = window.location.pathname === '/' || 
                      window.location.pathname.includes('index.html') ||
                      window.location.pathname.endsWith('/');
  
  if (!isIndexPage) {
    console.log("🔄 Redirigiendo a index con categoría:", categoriaOriginal);
    window.location.href = `index.html#${categoriaOriginal}`;
    return;
  }
  
  try {
    // OCULTAR EL BANNER cuando se muestra una categoría específica
    const bannerContainer = document.querySelector('.banner_container');
    if (bannerContainer) {
      bannerContainer.style.display = 'none';
    }
    
    const mainContainer = document.querySelector('.main_container');
    
    if (!mainContainer) {
      console.error("❌ No se encontró .main_container");
      return;
    }
    mainContainer.style.marginTop = '80px';
    mainContainer.innerHTML = '<div class="loader"><div class="spinner"></div><p>Cargando productos...</p></div>';
    
    const response = await fetch('productos-mock.json');
    
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo productos-mock.json');
    }
    
    const data = await response.json();
    
    const categoriaNormalizada = categoriaOriginal.toLowerCase().trim();
    const productosCategoria = data.productos.filter(p => 
      p.categoria.toLowerCase().trim() === categoriaNormalizada
    );
    
    console.log(`✅ Productos encontrados en "${categoriaOriginal}":`, productosCategoria.length);
    
    if (productosCategoria.length === 0) {
      mainContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <span class="material-symbols-outlined" style="font-size: 64px; color: #ff7700;">search_off</span>
          <h2 style="margin: 20px 0; color: #333;">No hay productos en "${capitalizar(categoriaOriginal)}"</h2>
          <p style="color: #666; margin-bottom: 20px;">Esta categoría no tiene productos disponibles actualmente.</p>
          <button onclick="cargarTodasLasCategorias()" style="
            padding: 12px 24px;
            background: #ff7700;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
          ">Ver todas las categorías</button>
        </div>
      `;
      return;
    }
    
    mainContainer.innerHTML = '';
    
    const seccion = document.createElement('section');
    seccion.className = 'main_product_transition';
    seccion.id = categoriaNormalizada;
    
    seccion.innerHTML = `
      <button class="main_desktop__product_buttom left main_desktop" aria-label="Anterior">
        <span class="material-symbols-outlined left">chevron_left</span>
      </button>
      
      <div class="main_product_container">
        <h3 class="main_product_show_tittle_secundary main_desktop">${capitalizar(categoriaOriginal)}</h3>
        <section class="main_product_show aire desktop">
          <h3 class="main_product_show_tittle_secundary main_phone">${capitalizar(categoriaOriginal)}</h3>
          <div class="main_product_show_list">
            ${productosCategoria.map(producto => `
              <a href="./muestra-producto.html?id=${producto.id}" class="main_product_show_a">
                <article class="product_card">
                  <img src="${producto.imagen || 'placeholder.jpg'}" alt="${producto.nombre}"/>
                  <strong class="main_product_price">$${formatearPrecio(producto.precio)}</strong>
                  <h4 class="producto_categoria">${capitalizar(categoriaOriginal)}</h4>
                  <h3 class="product_name">${producto.nombre}</h3>
                </article>
              </a>
            `).join('')}
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


// FUNCIÓN BUSCADOR

function inicializarBuscador() {
  const form = document.querySelector(".search_bar_form");
  const input = document.querySelector(".search_bar_input");

  console.log("🔍 Inicializando buscador");

  if (!form || !input) {
    console.error("❌ No se encontró el formulario o input");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    window.location.href = `busqueda.html?q=${encodeURIComponent(texto)}`;
  });

  console.log("✅ Buscador listo");
}


// SLIDERS INICIALES

document.querySelectorAll('.main_product_transition').forEach(slider => {
  const track = slider.querySelector('.main_product_container');
  const btnLeft = slider.querySelector('.main_desktop__product_buttom.left');
  const btnRight = slider.querySelector('.main_desktop__product_buttom.right');

  if (!track || !btnLeft || !btnRight){
    console.warn('Slider incompleto, se ignora:', slider.id);
    return;
  }

  btnLeft.addEventListener('click', () => {
    const cards = Array.from(track.querySelectorAll('.product_card'));
    const containerRect = track.getBoundingClientRect();
    
    const visibleCards = cards.filter(card => {
      const cardRect = card.getBoundingClientRect();
      return cardRect.left >= containerRect.left - 10;
    });
    
    const currentIndex = cards.indexOf(visibleCards[0]);
    const targetCard = cards[Math.max(0, currentIndex - 1)];
    
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  });

  btnRight.addEventListener('click', () => {
    const cards = Array.from(track.querySelectorAll('.product_card'));
    const containerRect = track.getBoundingClientRect();
    
    const visibleCards = cards.filter(card => {
      const cardRect = card.getBoundingClientRect();
      return cardRect.left >= containerRect.left - 10;
    });
    
    const currentIndex = cards.indexOf(visibleCards[0]);
    const targetCard = cards[Math.min(cards.length - 1, currentIndex + 1)];
    
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  });
});


// HEADER

fetch("components/header.html?v=" + Date.now())
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-header").innerHTML = data;
    console.log("✅ Header cargado");

    const btn = document.querySelector('.menu_btn');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav_list_item_a');

    if (btn && nav) {
      btn.addEventListener('click', () => {
        nav.classList.toggle('open');
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
      });
    });

    inicializarBuscador();
       // Configurar botones de WhatsApp del header
    const botonesWhatsAppHeader = document.querySelectorAll('.contact_list .whatsapp');
    const numeroLasFlores = '5491112345678';
    const numeroMitre = '5491187654321';
    
    botonesWhatsAppHeader.forEach(boton => {
      const texto = boton.textContent.toLowerCase();
      let numeroWhatsApp = numeroLasFlores;
      let sucursal = 'Las Flores';
      
      if (texto.includes('mitre')) {
        numeroWhatsApp = numeroMitre;
        sucursal = 'Mitre';
      }
      
      const mensajeGeneral = `Hola! Quisiera consultar sobre productos disponibles en sucursal ${sucursal}`;
      const mensajeCodificado = encodeURIComponent(mensajeGeneral);
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
      
      boton.href = urlWhatsApp;
      boton.target = '_blank';
      boton.rel = 'noopener noreferrer';
    });
    
    console.log("✅ Botones de WhatsApp configurados");
  })
  .catch(error => {
    console.error("❌ Error cargando header:", error);
  });


// FOOTER

fetch("components/footer.html?v=" + Date.now())
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-footer").innerHTML = data;
    console.log("✅ Footer cargado");
  })
  .catch(error => {
    console.error("❌ Error cargando footer:", error);
  });


// MAIN

// Generar un número aleatorio además del timestamp para forzar actualización
const randomCache = Math.random().toString(36).substring(7);
const timestamp = Date.now();

fetch(`components/main.html?v=${timestamp}&r=${randomCache}`, {
  method: 'GET',
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-main").innerHTML = data;
    console.log("✅ Main cargado");
    
    // DESPUÉS de cargar el main, inicializar las categorías
    const isIndexPage = window.location.pathname === '/' || 
                        window.location.pathname.includes('index.html') ||
                        window.location.pathname.endsWith('/');
    
    if (isIndexPage) {
      const hash = window.location.hash.replace('#', '');
      
      if (hash) {
        console.log('🔗 Hash detectado, cargando categoría:', hash);
        mostrarSoloCategoria(hash);
      } else {
        console.log('📋 Sin hash, cargando todas las categorías');
        cargarTodasLasCategorias();
      }
    }
  })
  .catch(error => {
    console.error("❌ Error cargando main:", error);
  });

// INICIALIZAR DROPDOWNS

function inicializarDropdownElectro() {
  const dropdownBtn = document.getElementById('dropdownElectro');
  const dropdownMenu = document.getElementById('menuElectro');
  
  if (!dropdownBtn || !dropdownMenu) {
    console.warn('⚠️ Dropdown de electrodomésticos no encontrado');
    return;
  }

  const dropdownArrow = dropdownBtn.querySelector('.dropdown-arrow');

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
    if (dropdownArrow) {
      dropdownArrow.classList.toggle('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }
    }
  });

  document.querySelectorAll('#menuElectro .dropdown-item-electro').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }

      let categoria = item.getAttribute('data-categoria');
      if (!categoria) {
        const href = item.getAttribute('href');
        categoria = href.replace('/index.html#', '').replace('#', '');
      }
      
      console.log("🎯 Click en categoría:", categoria);
      await mostrarSoloCategoria(categoria);
    });
  });

  console.log('✅ Dropdown de electrodomésticos inicializado');
}

function inicializarDropdownDescanso() {
  const dropdownBtn = document.getElementById('dropdownDescanso');
  const dropdownMenu = document.getElementById('menuDescanso');
  
  if (!dropdownBtn || !dropdownMenu) {
    console.warn('⚠️ Dropdown de descanso no encontrado');
    return;
  }

  const dropdownArrow = dropdownBtn.querySelector('.dropdown-arrow');

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
    if (dropdownArrow) {
      dropdownArrow.classList.toggle('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }
    }
  });

  document.querySelectorAll('#menuDescanso .dropdown-item-electro').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }

      let categoria = item.getAttribute('data-categoria');
      if (!categoria) {
        const href = item.getAttribute('href');
        categoria = href.replace('/index.html#', '').replace('#', '');
      }
      
      await mostrarSoloCategoria(categoria);
    });
  });

  console.log('✅ Dropdown de descanso inicializado');
}

function inicializarDropdownMuebles() {
  const dropdownBtn = document.getElementById('dropdownMuebles');
  const dropdownMenu = document.getElementById('menuMuebles');
  
  if (!dropdownBtn || !dropdownMenu) {
    console.warn('⚠️ Dropdown de muebles no encontrado');
    return;
  }

  const dropdownArrow = dropdownBtn.querySelector('.dropdown-arrow');

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
    if (dropdownArrow) {
      dropdownArrow.classList.toggle('open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }
    }
  });

  document.querySelectorAll('#menuMuebles .dropdown-item-electro').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }

      let categoria = item.getAttribute('data-categoria');
      if (!categoria) {
        const href = item.getAttribute('href');
        categoria = href.replace('/index.html#', '').replace('#', '');
      }
      
      await mostrarSoloCategoria(categoria);
    });
  });

  console.log('✅ Dropdown de muebles inicializado');
}

const intervaloDropdowns = setInterval(() => {
  if (document.getElementById('dropdownElectro')) {
    console.log('🔄 Inicializando todos los dropdowns...');
    inicializarDropdownElectro();
    inicializarDropdownDescanso();
    inicializarDropdownMuebles();
    clearInterval(intervaloDropdowns);
    console.log('✅ Todos los dropdowns inicializados');
  }
}, 100);
