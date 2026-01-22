export function initSlideshow() {
  const slideContainer = document.querySelector('.js-slideshow-container');
  const slideModules = import.meta.glob('../../../../public/zassets/images/slideshow/*.{png,jpg,JPG,jpeg,webp,avif}', {
    eager: true,
    import: 'default'
  });
  const images = Object.keys(slideModules)
    .sort()
    .map((key) => slideModules[key]);

  if (!slideContainer || images.length === 0) return;
  
  images.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Slideshow image';
    img.classList.add('w-full', 'h-full', 'object-cover', 'shrink-0');
    slideContainer.appendChild(img);
  });

  // Clone first slide to the end for seamless forward-only loop
  if (images.length > 1) {
    const firstClone = slideContainer.firstElementChild.cloneNode(true);
    firstClone.setAttribute('aria-hidden', 'true');
    slideContainer.appendChild(firstClone);
  }

  const slides = slideContainer.querySelectorAll('img');
  let currentIndex = 0;
  
  // Set initial styles
  slideContainer.style.transition = 'transform 2s ease';
  slideContainer.style.width = `${slides.length * 100}%`;
  slides.forEach(slide => {
    slide.style.width = `${100 / slides.length}%`;
  });
  
  function nextSlide() {
    currentIndex++;
    slideContainer.style.transform = `translateX(-${currentIndex * (100 / slides.length)}%)`;
    
    // When we reach the clone of the first slide, jump back to start without reversing direction
    if (currentIndex === slides.length - 1) {
      setTimeout(() => {
        slideContainer.style.transition = 'none';
        currentIndex = 0;
        slideContainer.style.transform = `translateX(0)`;
        setTimeout(() => {
          slideContainer.style.transition = 'transform 1.5s ease';
        }, 20);
      }, 1500); // Match the transition duration
    }
  }
  
  // Auto advance every 5 seconds
  setInterval(nextSlide, 4000);
}
