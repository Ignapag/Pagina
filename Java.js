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

const track = document.querySelector('.main_desktop_product_container');
const btnLeft = document.querySelector('.main_desktop__product_buttom.left');
const btnRight = document.querySelector('.main_desktop__product_buttom.right');

const CARD_WIDTH = 280;

btnLeft.addEventListener('click', () => {
  track.scrollBy({ left: -CARD_WIDTH, behavior: 'smooth' });
});

btnRight.addEventListener('click', () => {
  track.scrollBy({ left: CARD_WIDTH, behavior: 'smooth' });
});

