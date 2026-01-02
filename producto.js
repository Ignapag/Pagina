// Cargar productos desde el JSON
fetch('productos-mock.json')
  .then(response => response.json())
  .then(data => {
    window.productosDB = data.productos;
    console.log("✅ Base de datos cargada:", window.productosDB.length, "productos");
  })
  .catch(error => {
    console.error("❌ Error cargando productos:", error);
  });

// LÓGICA SOLO PARA MUESTRA-PRODUCTO.HTML
if (window.location.pathname.includes('muestra-producto')) {
  
  window.addEventListener('DOMContentLoaded', async () => {
    // Esperar a que se cargue productosDB
    while (!window.productosDB) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    const producto = window.productosDB.find((p) => p.id === productId);

    if (!producto) {
      console.error("Producto no encontrado:", productId);
      const cont = document.querySelector(".only_product_container");
      if (cont) cont.innerHTML = `<p>Producto no encontrado.</p>`;
      return;
    }

    console.log("✅ Cargando producto:", producto.nombre);

    // Título
    const titleEls = document.querySelectorAll(".only_product_tittle");
    titleEls.forEach(el => {
      el.textContent = producto.nombre;
    });
  
    // Imagen
    const imgEl = document.querySelector(".only_product_img");
    if (imgEl) {
      imgEl.src = producto.imagen;
      imgEl.alt = producto.nombre;
    }

    // Precio (agregamos el precio a la descripción)
    const descEl = document.querySelector(".only_product_description");
    if (descEl) {
      descEl.innerHTML = `
      <strong class="only_product_precio">$${producto.precio.toLocaleString('es-AR')}</strong>
        <div style="display:flex; gap: 20px;flex-direction:column;margin-bottom: 1rem;">
        <strong style="font-size: 1.5rem;margin-top:20px;">Descripcion:</strong>
        <p>${producto.descripcion || 'Producto de alta calidad disponible en Positivo Hogar.'}</p>
        </div>
      `;
    }

    // Categoría del producto
    document.body.dataset.productType = producto.categoria;

    // Características (generamos características básicas si no existen)
    const ul = document.querySelector(".only_product_list");
    if (ul) {
      ul.innerHTML = "";

      // Si el producto tiene características, las usamos
      if (producto.caracteristicas && Array.isArray(producto.caracteristicas)) {
        producto.caracteristicas.forEach((carac) => {
          const li = document.createElement("li");
          li.className = "only_product_list_item";
          li.innerHTML = `
            <span class="feature-label">${carac.label}:</span>
            <span class="product_strong">${carac.value}</span>
          `;
          ul.appendChild(li);
        });
      } else {
        // Características genéricas basadas en la información disponible
        const caracteristicasGenericas = [
          { label: "Marca", value: obtenerMarca(producto.nombre) },
          { label: "Modelo", value: producto.nombre },
          { label: "Categoría", value: capitalizar(producto.categoria) },
          { label: "Precio", value: `$${producto.precio.toLocaleString('es-AR')}` }
        ];

        caracteristicasGenericas.forEach((carac) => {
          const li = document.createElement("li");
          li.className = "only_product_list_item";
          li.innerHTML = `
            <span class="feature-label">${carac.label}:</span>
            <span class="product_strong">${carac.value}</span>
          `;
          ul.appendChild(li);
        });
      }
    }

    // Configurar botones de WhatsApp
    configurarBotonesWhatsApp(producto);

    console.log("✅ Producto cargado correctamente");
  });
}

// Función auxiliar para extraer la marca del nombre del producto
function obtenerMarca(nombreProducto) {
  const palabras = nombreProducto.split(' ');
  return palabras[0];
}

// Función auxiliar para capitalizar texto
function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Configurar los botones de WhatsApp con el producto
function configurarBotonesWhatsApp(producto) {
  const botonesWhatsApp = document.querySelectorAll('.whatsapp');
  
  const mensaje = `Hola! Me interesa el producto: ${producto.nombre} - $${producto.precio.toLocaleString('es-AR')}`;
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // Números de WhatsApp (reemplaza con los reales)
  const numeroLasFlores = '5491112345678';
  const numeroMitre = '5491187654321';
  
  botonesWhatsApp.forEach(boton => {
    const texto = boton.textContent.toLowerCase();
    let numeroWhatsApp = numeroLasFlores;
    
    if (texto.includes('mitre')) {
      numeroWhatsApp = numeroMitre;
    }
    
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
    
    if (boton.tagName === 'A') {
      boton.href = urlWhatsApp;
      boton.target = '_blank';
      boton.rel = 'noopener noreferrer';
    } else if (boton.closest('button')) {
      boton.closest('button').onclick = () => {
        window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
      };
    }
  });
}

// Botón de volver
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
    
    console.log("✅ Botón de volver configurado");
  }
});