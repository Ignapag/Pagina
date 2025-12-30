console.log("Java.js cargado");

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

// ===============================
// HEADER
// ===============================
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
  })
  .catch(error => {
    console.error("❌ Error cargando header:", error);
  });

// ===============================
// FOOTER
// ===============================
fetch("components/footer.html?v=" + Date.now())
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-footer").innerHTML = data;
    console.log("✅ Footer cargado");
  })
  .catch(error => {
    console.error("❌ Error cargando footer:", error);
  });

// ===============================
// FUNCIÓN BUSCADOR
// ===============================
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

// ===============================
// FILTRAR CATEGORÍAS
// ===============================
async function mostrarSoloCategoria(categoriaOriginal) {
  console.log("📂 Intentando mostrar categoría:", categoriaOriginal);
  
  try {
    // Mostrar loading
    const mainContainer = document.querySelector('.main_container');
    mainContainer.innerHTML = '<div class="loader"><div class="spinner"></div><p>Cargando productos...</p></div>';
    
    // Cargar productos del JSON
    const response = await fetch('productos-mock.json');
    
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo productos-mock.json');
    }
    
    const data = await response.json();
    
    console.log("📦 Total de productos en JSON:", data.productos.length);
    console.log("📋 Categorías disponibles:", [...new Set(data.productos.map(p => p.categoria))]);
    
    // Normalizar la categoría buscada (lowercase, sin espacios)
    const categoriaNormalizada = categoriaOriginal.toLowerCase().trim();
    
    // Filtrar productos de esta categoría (case-insensitive)
    const productosCategoria = data.productos.filter(p => 
      p.categoria.toLowerCase().trim() === categoriaNormalizada
    );
    
    console.log(`✅ Productos encontrados en "${categoriaOriginal}":`, productosCategoria.length);
    
    if (productosCategoria.length === 0) {
      console.warn(`⚠️ No hay productos en la categoría "${categoriaOriginal}"`);
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
          
          <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
            <h3 style="color: #ff7700; margin-bottom: 10px;">🔍 Info para debugging:</h3>
            <p><strong>Categoría buscada:</strong> "${categoriaOriginal}"</p>
            <p><strong>Categorías disponibles en el JSON:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${[...new Set(data.productos.map(p => p.categoria))].map(cat => 
                `<li>${cat} (${data.productos.filter(p => p.categoria === cat).length} productos)</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      `;
      return;
    }
    
    mainContainer.innerHTML = '';
    
    // Crear sección solo para esta categoría
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
    
    // Re-inicializar sliders
    inicializarSlidersNuevos();
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error("❌ Error al mostrar categoría:", error);
    const mainContainer = document.querySelector('.main_container');
    mainContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <span class="material-symbols-outlined" style="font-size: 64px; color: #dc3545;">error</span>
        <h2 style="margin: 20px 0; color: #333;">Error al cargar productos</h2>
        <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
        <button onclick="cargarTodasLasCategorias()" style="
          padding: 12px 24px;
          background: #ff7700;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        ">Reintentar</button>
      </div>
    `;
  }
}


// ===============================
// INICIALIZAR DROPDOWNS
// ===============================
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

  // Manejar clicks en los items
  document.querySelectorAll('#menuElectro .dropdown-item-electro').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Cerrar el dropdown
      dropdownMenu.classList.remove('show');
      if (dropdownArrow) {
        dropdownArrow.classList.remove('open');
      }

      // Obtener la categoría del atributo data-categoria o del href
      let categoria = item.getAttribute('data-categoria');
      if (!categoria) {
        const href = item.getAttribute('href');
        categoria = href.replace('/index.html#', '').replace('#', '');
      }
      
      console.log("🎯 Click en categoría:", categoria);
      
      // Mostrar solo esta categoría
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

// ===============================
// FUNCIONES AUXILIARES
// ===============================
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

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearPrecio(precio) {
  return precio.toLocaleString('es-AR');
}

// ===============================
// CATEGORÍAS VISIBLES EN MAIN
// ===============================
const CATEGORIAS_VISIBLES_MAIN = [
  'aires',
  'televisores', 
  'celulares',
  'lavarropas',
  'heladeras',
  'otros'
];
// ===============================
// CARGAR SOLO CATEGORÍAS VISIBLES EN MAIN
// ===============================
async function cargarTodasLasCategorias() {
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
      
      // Solo agregar si la categoría está en la lista de visibles
      if (CATEGORIAS_VISIBLES_MAIN.includes(categoriaLower)) {
        if (!productosPorCategoria[producto.categoria]) {
          productosPorCategoria[producto.categoria] = [];
        }
        productosPorCategoria[producto.categoria].push(producto);
      }
    });
    
    const mainContainer = document.querySelector('.main_container');
    if (!mainContainer) return;
    
    mainContainer.innerHTML = '';
    
    // Mostrar categorías en el orden definido en CATEGORIAS_VISIBLES_MAIN
    CATEGORIAS_VISIBLES_MAIN.forEach(categoriaVisible => {
      // Buscar la categoría en productosPorCategoria (case-insensitive)
      const categoriaKey = Object.keys(productosPorCategoria).find(
        key => key.toLowerCase() === categoriaVisible
      );
      
      if (!categoriaKey) return; // Si no hay productos de esta categoría, continuar
      
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
// ===============================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ===============================
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 DOM cargado, verificando página...');
  console.log('📍 Pathname:', window.location.pathname);
  
  // Solo cargar categorías si estamos en index.html o en la raíz
  const isIndexPage = window.location.pathname === '/' || 
                      window.location.pathname.includes('index.html') ||
                      window.location.pathname.endsWith('/');
  
  if (isIndexPage) {
    console.log('✅ Estamos en index, cargando categorías...');
    cargarTodasLasCategorias();
  } else {
    console.log('ℹ️ No estamos en index, no se cargan las categorías');
  }
});

// También puedes probar con esto como respaldo:
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
      cargarTodasLasCategorias();
    }
  });
} else {
  // El DOM ya está cargado
  if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
    cargarTodasLasCategorias();
  }
}