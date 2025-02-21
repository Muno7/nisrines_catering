export function animateFeatureCards() {
  document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.feature-card');
    
    // Only run the intersection observer if we're on mobile
    if (window.innerWidth < 640) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            // Once the animation is triggered, we don't need to observe this element anymore
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.2, // Trigger when 20% of the card is visible
        rootMargin: '0px' // No margin
      });

      cards.forEach(card => observer.observe(card));
    } else {
      // On desktop, show all cards immediately
      cards.forEach(card => card.classList.add('animate'));
    }
  });
}  