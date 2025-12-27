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
  
  // Encontrar la card visible más a la izquierda
  const visibleCards = cards.filter(card => {
    const cardRect = card.getBoundingClientRect();
    return cardRect.left >= containerRect.left - 10;
  });
  
  // Obtener el índice y retroceder una card
  const currentIndex = cards.indexOf(visibleCards[0]);
  const targetCard = cards[Math.max(0, currentIndex - 1)];
  
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
});

btnRight.addEventListener('click', () => {
  const cards = Array.from(track.querySelectorAll('.product_card'));
  const containerRect = track.getBoundingClientRect();
  
  // Encontrar la primera card completamente visible
  const visibleCards = cards.filter(card => {
    const cardRect = card.getBoundingClientRect();
    return cardRect.left >= containerRect.left - 10;
  });
  
  // Ir a la siguiente card
  const currentIndex = cards.indexOf(visibleCards[0]);
  const targetCard = cards[Math.min(cards.length - 1, currentIndex + 1)];
  
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
});
});

// ===============================
// HEADER (con cache-busting)
// ===============================
fetch("components/header.html?v=" + Date.now())
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-header").innerHTML = data;
    console.log("✅ Header cargado");

    // Inicializar eventos del header
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

    // Inicializar buscador DESPUÉS de cargar el header
    inicializarBuscador();
  })
  .catch(error => {
    console.error("❌ Error cargando header:", error);
  });

// ===============================
// FOOTER (con cache-busting)
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
// FUNCIÓN BUSCADOR - REDIRIGE A PÁGINA DE BÚSQUEDA
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
    console.log("🔍 Búsqueda enviada");

    const texto = input.value.trim();
    if (!texto) return;

    // Redirigir a página de búsqueda
    window.location.href = `busqueda.html?q=${encodeURIComponent(texto)}`;
  });

  console.log("✅ Buscador listo");
}

// ===============================
// SMOOTH SCROLL (sliders)
// ===============================
function easeInOut(t) {
  return t * t * (3 - 2 * t); // Más rápida y suave
}

function smoothScrollTo(container, targetPosition, duration = 200) {
  const start = container.scrollLeft;
  const distance = targetPosition - start;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    container.scrollLeft = start + distance * easeInOut(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}