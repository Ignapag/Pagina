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