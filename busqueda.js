    console.log("🔍 busqueda.js cargado");

    // Obtener el término de búsqueda de la URL
    const paramsSearch = new URLSearchParams(window.location.search);
    const terminoBusqueda = paramsSearch.get('q') || '';

    console.log("Término buscado:", terminoBusqueda);

    // Función principal de búsqueda
    async function realizarBusqueda() {
    console.log("🔍 Realizando búsqueda...");
    
    const contenedor = document.getElementById('resultados');
    const sinResultados = document.getElementById('sin-resultados');
    const titulo = document.querySelector('.busqueda_titulo');
    const info = document.querySelector('.busqueda_info');

    // Mostrar loading
    if (contenedor) {
        contenedor.innerHTML = '<div class="loader"><div class="spinner"></div><p>Buscando productos...</p></div>';
        contenedor.style.display = 'grid';
    }
    if (sinResultados) {
        sinResultados.style.display = 'none';
    }

    // Esperar a que se cargue productosDB desde producto.js
    while (!window.productosDB) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const productos = window.productosDB;

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
        
        const enDescripcion = producto.descripcion 
        ? producto.descripcion.toLowerCase().includes(texto)
        : false;
        
        const enCaracteristicas = producto.caracteristicas 
        ? producto.caracteristicas.some(carac => 
            carac.label.toLowerCase().includes(texto) ||
            carac.value.toLowerCase().includes(texto)
            )
        : false;

        const enId = producto.id.toLowerCase().includes(texto);

        return enNombre || enCategoria || enDescripcion || enCaracteristicas || enId;
    });

    console.log("✅ Resultados encontrados:", resultados.length);

    // Si no hay resultados
    if (resultados.length === 0) {
        info.textContent = 'No se encontraron productos';
        contenedor.style.display = 'none';
        sinResultados.style.display = 'block';
        
        const sinResultadosTexto = document.querySelector('.sin_resultados_texto');
        const sinResultadosSugerencia = document.querySelector('.sin_resultados_sugerencia');
        
        if (sinResultadosTexto) {
        sinResultadosTexto.textContent = `No se encontraron productos para "${terminoBusqueda}"`;
        }
        if (sinResultadosSugerencia) {
        sinResultadosSugerencia.innerHTML = `
            Intenta con otras palabras clave o busca por categorías:<br>
            <small>Televisores, Aires, Celulares, Lavarropas, Heladeras, Cocinas, Parlantes</small>
        `;
        }
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
        
        const precioFormateado = `$${producto.precio.toLocaleString('es-AR')}`;
        const descripcionCorta = producto.descripcion 
        ? (producto.descripcion.length > 100 
            ? producto.descripcion.substring(0, 100) + '...' 
            : producto.descripcion)
        : 'Producto disponible en Positivo Hogar';
        const categoriaFormateada = producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1);
        
        card.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" class="resultado_imagen">
        <strong class="resultado_precio main_product_price">${precioFormateado}</strong>
        <div class="resultado_categoria">${categoriaFormateada}</div>
        <h3 class="resultado_nombre">${producto.nombre}</h3>
        <p class="resultado_descripcion">${descripcionCorta}</p>
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

    // Inicializar búsqueda cuando el DOM esté listo
    window.addEventListener('DOMContentLoaded', () => {
    console.log("🔄 DOM cargado - Iniciando búsqueda");
    
    setTimeout(() => {
        realizarBusqueda();
    }, 200);
    
    setTimeout(actualizarBuscadorHeader, 600);
    });