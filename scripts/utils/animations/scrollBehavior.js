export function setCategoryScrollBehavior () {
  const leftButtons = document.querySelectorAll('#scrollLeft');
  const rightButtons = document.querySelectorAll('#scrollRight');

  leftButtons.forEach(button => {
      const category = button.dataset.category;
      const container = document.getElementById(`${category}-scrollContainer`);
      if (container.scrollWidth <= container.clientWidth) {
          button.classList.add('hidden');
          button.classList.remove('lg:flex');
      }
      button.addEventListener('click', () => {
          const scrollAmount = container.offsetWidth; // Set scroll amount to the width of the container
          container.scrollBy({
              left: -scrollAmount,
              behavior: 'smooth'
          });
      });
  });

  rightButtons.forEach(button => {
      const category = button.dataset.category; // Get the category from data attribute
      const container = document.getElementById(`${category}-scrollContainer`);
      if (container.scrollWidth <= container.clientWidth) {
          button.classList.add('hidden');
          button.classList.remove('lg:flex');
      }
      button.addEventListener('click', () => {
          const scrollAmount = container.offsetWidth; // Set scroll amount to the width of the container
          container.scrollBy({
              left: scrollAmount,
              behavior: 'smooth'
          });
      });
  });
}
