document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    const productos = {
        "aire-philco": {
        titulo: "Aire Acondicionado Philco",
        imagen: "airepng.png",
        descripcion: "El aire acondicionado Philco es la solución perfecta para mantener tu hogar cómodo durante todo el año. Con su capacidad de frío y calor, este modelo te permite disfrutar de un ambiente agradable, sin importar la temporada. Su diseño moderno y funcional se adapta a cualquier decoración, mientras que su tecnología avanzada garantiza un funcionamiento silencioso y de bajo consumo energético.",
        caracteristicas: {
            sleep: true,
            remote: true,
            timer: true,
            cooling: "3200 frigorías",
            heating: "3400 kcal",
            ext: "800 x 550 x 300 mm",
            int: "900 x 300 x 220 mm",
        },
        },

        "aire-basico": {
        titulo: "Aire Acondicionado Básico",
        imagen: "Aire_prueba.webp",
        descripcion: "Modelo simple y económico.",
        caracteristicas: {
            sleep: false,
            remote: true,
            timer: false,
            cooling: "2500 frigorías",
            heating: "—",
            ext: "750 x 500 x 280 mm",
            int: "850 x 290 x 210 mm",
        },
        },
    };

    const producto = productos[productId];

    // Si no existe el producto, cortar prolijo
    if (!productId || !producto) {
        console.error("Producto no encontrado:", productId);
        const t = document.querySelector(".only_product_tittle");
        if (t) t.textContent = "Producto no encontrado";
        return;
    }

    // Pintar título / imagen / descripción
    document.querySelector(".only_product_tittle").textContent = producto.titulo;
    document.querySelector(".only_product_img").src = producto.imagen;
    document.querySelector(".only_product_img").alt = producto.titulo;
    document.querySelector(".only_product_description").textContent = producto.descripcion;

    const c = producto.caracteristicas;

    // Helper: setea el valor después de los ":" y opcionalmente oculta si viene vacío/—
    function setValue(id, value, { hideIfEmpty = false } = {}) {
        const el = document.getElementById(id);
        if (!el) return;

        const isEmpty = value === undefined || value === null || value === "" || value === "—";
        if (hideIfEmpty && isEmpty) {
        // oculta el <li> completo (el parent del <strong>)
        el.closest("li").style.display = "none";
        return;
        }

        el.textContent = value;
    }

    // “Solo cambia lo de después de los :”
    setValue("aire-sleep", c.sleep ? "Sí" : "No");
    setValue("aire-remote-control", c.remote ? "Sí" : "No");
    setValue("aire-temporizador", c.timer ? "Sí" : "No");
    setValue("aire-refrigeracion", c.cooling);

    // si querés ocultar calefacción cuando sea "—"
    setValue("aire-calefaccion", c.heating, { hideIfEmpty: true });

    setValue("aire-dimension-externa", c.ext);
    setValue("aire-dimension-interna", c.int);
    });
