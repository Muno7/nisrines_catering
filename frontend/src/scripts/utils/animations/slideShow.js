import { API_BASE_URL } from "../../../config";

async function fetchSlideshowImages() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/slideshow`);
    if (!res.ok) throw new Error("Failed to load slideshow images");
    const { data } = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((item) => item.image).filter(Boolean);
  } catch (e) {
    console.warn("Falling back to local slideshow assets:", e);
  }
  return [];
}

export async function initSlideshow() {
  const slideContainer = document.querySelector(".js-slideshow-container");
  if (!slideContainer) return Promise.resolve();

  let resolveFirstImage = null;
  let firstImageResolved = false;
  const firstImageReady = new Promise((resolve) => {
    resolveFirstImage = resolve;
  });

  const markFirstImageReady = () => {
    if (firstImageResolved) return;
    firstImageResolved = true;
    if (resolveFirstImage) resolveFirstImage();
  };

  const transitionMs = 1750;
  const intervalMs = 4000;

  const images = await fetchSlideshowImages();
  if (images.length === 0) {
    markFirstImageReady();
    return firstImageReady;
  }

  images.forEach((src, index) => {
    const img = document.createElement("img");
    if (index === 0) {
      img.addEventListener("load", markFirstImageReady, { once: true });
      img.addEventListener("error", markFirstImageReady, { once: true });
    }
    img.src = src;
    img.alt = "Slideshow image";
    img.classList.add("w-full", "h-full", "object-cover", "shrink-0");
    slideContainer.appendChild(img);
    if (index === 0 && img.complete) {
      markFirstImageReady();
    }
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
  slideContainer.style.transition = `transform ${transitionMs}ms ease`;
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
          slideContainer.style.transition = `transform ${transitionMs}ms ease`;
        }, 20);
      }, transitionMs); // Match the transition duration
    }
  }
  
  // Auto advance every 5 seconds
  setInterval(nextSlide, intervalMs);

  return firstImageReady;
}
