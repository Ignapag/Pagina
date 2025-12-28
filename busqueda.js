    // busqueda.js - Maneja la página de resultados de búsqueda

    console.log("🔍 busqueda.js cargado");

    // Obtener el término de búsqueda de la URL
    const paramsSearch = new URLSearchParams(window.location.search);
    const terminoBusqueda = paramsSearch.get('q') || '';

    console.log("Término buscado:", terminoBusqueda);

    // Función principal de búsqueda
    function realizarBusqueda() {
    console.log("🔍 Realizando búsqueda...");
    

    const contenedor = document.getElementById('resultados');
    const sinResultados = document.getElementById('sin-resultados');
    const titulo = document.querySelector('.busqueda_titulo');
    const info = document.querySelector('.busqueda_info');

    // Si no hay término de búsqueda
    if (!terminoBusqueda) {
        titulo.textContent = 'Búsqueda vacía';
        info.textContent = 'Ingresa un término de búsqueda';
        contenedor.style.display = 'none';
        sinResultados.style.display = 'block';
        return;
    }

    // Actualizar título
    titulo.textContent = `Resultados para "${terminoBusqueda}"`;

    // Filtrar productos
    const texto = terminoBusqueda.toLowerCase().trim();
    const resultados = productos.filter(producto => {
        const enNombre = producto.nombre.toLowerCase().includes(texto);
        const enCategoria = producto.categoria.toLowerCase().includes(texto);
        const enDescripcion = producto.descripcion.toLowerCase().includes(texto);
        
        // Buscar en características
        const enCaracteristicas = producto.caracteristicas.some(carac => 
        carac.label.toLowerCase().includes(texto) ||
        carac.value.toLowerCase().includes(texto)
        );

        return enNombre || enCategoria || enDescripcion || enCaracteristicas;
    });

    console.log("✅ Resultados encontrados:", resultados.length);

    // Si no hay resultados
    if (resultados.length === 0) {
        info.textContent = 'No se encontraron productos';
        contenedor.style.display = 'none';
        sinResultados.style.display = 'block';
        return;
    }

    // Actualizar contador de resultados
    info.textContent = `${resultados.length} producto${resultados.length > 1 ? 's' : ''} encontrado${resultados.length > 1 ? 's' : ''}`;
    contenedor.style.display = 'grid';
    sinResultados.style.display = 'none';

    // Renderizar resultados
    contenedor.innerHTML = '';
    resultados.forEach(producto => {
        const card = document.createElement('a');
        card.href = `muestra-producto.html?id=${producto.id}`;
        card.className = 'resultado_card';
        
        card.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" class="resultado_imagen">
        <strong class="resultado_precio">${producto.precio}</strong>
        <div class="resultado_categoria">${producto.categoria}</div>
        <h3 class="resultado_nombre">${producto.nombre}</h3>
        <p class="resultado_descripcion">${producto.descripcion}</p>
        `;
        
        contenedor.appendChild(card);
    });

    console.log("✅ Resultados renderizados");
    }

    // Actualizar el buscador del header para mantener el término
    function actualizarBuscadorHeader() {
    const input = document.querySelector('.search_bar_input');
    
    if (input && terminoBusqueda) {
        input.value = terminoBusqueda;
        console.log("✅ Término de búsqueda restaurado en el header");
    }
    }

    window.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM cargado");
    
    setTimeout(() => {
        realizarBusqueda();
    }, 200);
    
    setTimeout(actualizarBuscadorHeader, 600);
    });