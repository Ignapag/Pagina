// producto.js - BASE DE DATOS GLOBAL

const productos = [
  // AIRES
  {
    id: "aire-philco-3200",
    precio:"999.999",
    categoria: "aires",
    nombre: "Aire Acondicionado Philco",
    imagen: "airepng.png",
    descripcion: "Aire acondicionado split inverter con tecnología de ahorro energético clase A++. El modelo HSPE3200FCINV tiene 3200 watts de potencia y clasificación de eficiencia energética Clase A++ en frío y A en calor.",
    caracteristicas: [
      { label: "Modo Sleep", value: "Sí" },
      { label: "Control remoto", value: "Sí" },
      { label: "Temporizador", value: "Sí" },
      { label: "Potencia de refrigeración", value: "3200 frigorías" },
      { label: "Potencia de calefacción", value: "3400 kcal"},
      { label: "Eficiencia energética", value: "A++" },
    ]
  },
  {
    id: "aire-samsung-2500",
    precio:"999.999",
    categoria: "aires",
    nombre: "Aire Samsung 2500W",
    imagen: "aire2_prueba.jpg",
    descripcion: "Aire acondicionado split con filtro purificador de aire",
    caracteristicas: [
      { label: "Potencia", value: "2500W" },
      { label: "Filtro purificador", value: "Sí" },
      { label: "WiFi", value: "Sí" }
    ]
  },

  // TELEVISORES
  {
    id: "tv-samsung-55",
    precio:"999.999",
    categoria: "televisores",
    nombre: 'Smart TV Samsung 55"',
    imagen: "Televisor_prueba.webp",
    descripcion: "Smart TV UHD 4K con sistema Tizen y control por voz",
    caracteristicas: [
      { label: "Resolución", value: "4K UHD" },
      { label: "Pulgadas", value: '55"' },
      { label: "Sistema", value: "Tizen" },
      { label: "HDR", value: "Sí" }
    ]
  },
  {
    id: "tv-lg-43",
    precio:"999.999",
    categoria: "televisores",
    nombre: 'Smart TV LG 43"',
    imagen: "Televisor2_prueba.jpg",
    descripcion: "Smart TV Full HD con WebOS y Magic Remote",
    caracteristicas: [
      { label: "Resolución", value: "Full HD" },
      { label: "Pulgadas", value: '43"' },
      { label: "Sistema", value: "WebOS" }
    ]
  },

  // PARLANTES
  {
    id: "parlante-jbl-flip",
    precio:"999.999",
    categoria: "parlantes",
    nombre: "Parlante JBL Flip 5",
    imagen: "parlante_prueba.jpg",
    descripcion: "Parlante bluetooth portátil resistente al agua",
    caracteristicas: [
      { label: "Bluetooth", value: "5.0" },
      { label: "Resistente al agua", value: "IPX7" },
      { label: "Autonomía", value: "12 horas" }
    ]
  },

  // HELADERAS
  {
    id: "heladera-whirlpool-360",
    precio:"999.999",
    categoria: "heladeras",
    nombre: "Heladera Whirlpool 360L",
    imagen: "heladera_prueba.jpg",
    descripcion: "Heladera con freezer no frost",
    caracteristicas: [
      { label: "Capacidad", value: "360 litros" },
      { label: "No Frost", value: "Sí" },
      { label: "Eficiencia", value: "A" }
    ]
  },

  // COCINAS
  {
    id: "cocina-volcan-4h",
    precio:"999.999",
    categoria: "cocinas",
    nombre: "Cocina Volcan 4 Hornallas",
    imagen: "cocina_prueba.jpg",
    descripcion: "Cocina a gas con horno y grill",
    caracteristicas: [
      { label: "Hornallas", value: "4" },
      { label: "Horno", value: "Sí" },
      { label: "Grill", value: "Sí" }
    ]
  },

  // CELULARES
  {
    id: "celular-samsung-a54",
    precio:"999.999",
    categoria: "celulares",
    nombre: "Samsung Galaxy A54",
    imagen: "celular_prueba.png",
    descripcion: "Smartphone con cámara de 50MP y 5G",
    caracteristicas: [
      { label: "Pantalla", value: '6.4"' },
      { label: "Cámara", value: "50MP" },
      { label: "5G", value: "Sí" },
      { label: "Almacenamiento", value: "128GB" }
    ]
  },

  // LAVARROPAS
  {
    id: "lavarropas-drean-8kg",
    precio:"999.999",
    categoria: "lavarropas",
    nombre: "Lavarropas Drean 8kg",
    imagen: "lavarropa_prueba.jpg",
    descripcion: "Lavarropas automático con 16 programas",
    caracteristicas: [
      { label: "Capacidad", value: "8kg" },
      { label: "Programas", value: "16" },
      { label: "Centrifugado", value: "1200 RPM" }
    ]
  },

  // OTROS
  {
    id: "microondas-philco-25l",
    precio:"999.999",
    categoria: "otros",
    nombre: "Microondas Philco 25L",
    imagen: "Aire_prueba.webp",
    descripcion: "Microondas digital con grill",
    caracteristicas: [
      { label: "Capacidad", value: "25 litros" },
      { label: "Grill", value: "Sí" },
      { label: "Potencia", value: "900W" }
    ]
  }
];

window.productosDB = productos;
console.log("✅ Base de datos cargada y exportada:", productos.length, "productos");


// LÓGICA SOLO PARA MUESTRA-PRODUCTO.HTML

if (window.location.pathname.includes('muestra-producto')) {
  
  window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    const producto = productos.find((p) => p.id === productId);

    if (!producto) {
      console.error("Producto no encontrado:", productId);
      const cont = document.querySelector(".only_product_container");
      if (cont) cont.innerHTML = `<p>Producto no encontrado.</p>`;
      return;
    }

    console.log("✅ Cargando producto:", producto.nombre);

    const titleEls = document.querySelectorAll(".only_product_tittle");
    titleEls.forEach(el => {
      el.textContent = producto.nombre;
    });
  
    const imgEl = document.querySelector(".only_product_img");
    if (imgEl) {
      imgEl.src = producto.imagen;
      imgEl.alt = producto.nombre;
    }

    const descEl = document.querySelector(".only_product_description");
    if (descEl) descEl.textContent = producto.descripcion;

    document.body.dataset.productType = producto.categoria;

    const ul = document.querySelector(".only_product_list");
    if (ul) {
      ul.innerHTML = "";

      producto.caracteristicas.forEach((carac) => {
        const li = document.createElement("li");
        li.className = "only_product_list_item";
        li.innerHTML = `
          <span class="feature-label">${carac.label}:</span>
          <span class="product_strong">${carac.value}</span>
        `;
        ul.appendChild(li);
      });
    }

    console.log("✅ Producto cargado correctamente");
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('muestra-producto')) return;
  
  const vienesDeBusqueda = document.referrer.includes('busqueda.html');
  
  if (vienesDeBusqueda) {
    const botonVolver = document.querySelector('.only_product_button_back');
    
    if (botonVolver) {
      botonVolver.addEventListener('click', () => {
        window.history.back();
      });
      
      console.log("✅ Botón de volver configurado");
    }
  } else {
    const botonVolver = document.querySelector('.only_product_button_back');
    if (botonVolver) {
      botonVolver.style.display = 'none';
    }
  }
});