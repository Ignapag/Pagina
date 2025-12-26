console.log("URL completa:", window.location.href);
console.log("Search:", window.location.search);
console.log("ID:", new URLSearchParams(window.location.search).get("id"));
console.log("Java.js cargado");
const form = document.querySelector(".search_bar_form");
const input = document.querySelector(".search_bar_input");

console.log("form:", form);
console.log("input:", input);

const btn = document.querySelector('.menu_btn');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav_list_item_a');

btn.addEventListener('click', () => {
  nav.classList.toggle('open');
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
  });
});

const CARD_WIDTH = 272;

document.querySelectorAll('.main_product_transition').forEach(slider => {
  const track = slider.querySelector('.main_product_container');
  const btnLeft = slider.querySelector('.main_desktop__product_buttom.left');
  const btnRight = slider.querySelector('.main_desktop__product_buttom.right');

  if (!track || !btnLeft || !btnRight){
    console.warn('Slider incompleto, se ignora:', slider.id);
    return;
  }

    btnLeft.addEventListener('click', () => {
      smoothScroll(track, -CARD_WIDTH, 500);
    });

    btnRight.addEventListener('click', () => {
      smoothScroll(track, CARD_WIDTH, 500);
    });
});

// ===============================
// HEADER
// ===============================
fetch("components/header.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-header").innerHTML = data;

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
  });
//buscador


form.addEventListener("submit", (e) => {
  e.preventDefault();

  const texto = input.value.toLowerCase().trim();
  if (!texto) return;

  // Mapeo de palabras → secciones
  if (texto.includes("aire")) {
    irASeccion("aires");
    return;
  }

  if (
    texto.includes("tv") ||
    texto.includes("televisor") ||
    texto.includes("televisores")
  ) {
    irASeccion("televisores");
    return;
  }

  alert("No se encontró esa categoría");
});

function irASeccion(id) {
  const seccion = document.getElementById(id);

  if (!seccion) return;

  seccion.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}



// ===============================
// FOOTER
// ===============================
fetch("components/footer.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("site-footer").innerHTML = data;
  });

  function easeInOut(t) {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

let isAnimating = false;

function smoothScroll(container, distance, duration = 500) {


  if (isAnimating) return;  
  isAnimating = true;

  const start = container.scrollLeft;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    container.scrollLeft = start + distance * easeInOut(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isAnimating = false;  
    }
  }

  requestAnimationFrame(animate);
}

