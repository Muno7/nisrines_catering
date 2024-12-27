function show(){
    document.querySelector('.hamburger').classList.toggle('open')
    document.querySelector('.navigation').classList.toggle('left-0')
    document.querySelector('.navigation').classList.toggle('left-[-75%]')
    document.querySelector('.navigation').classList.toggle('md:left-[-50%]')
    document.querySelector('.navigation').classList.toggle('lg:left-[-33%]')
    document.querySelector('.darker').classList.toggle('opacity-50')
}

// Function to adjust the side-navbar height based on the viewport
function adjustViewportHeight() {
    // Get the height of the window
    const windowHeight = window.innerHeight;
    
    // Set the height of the navbar or any container element (like main content)
    document.body.style.height = `${windowHeight}px`;

    // Optional: If you have other content that needs adjustment, you can target specific elements
    const mainContent = document.querySelector('.side-bar-js'); // Adjust selector as needed
    if (mainContent) {
        mainContent.style.height = `${windowHeight}px`;
    }
}

// Call the function on load and on resize to handle different screen sizes
window.addEventListener('load', adjustViewportHeight);
window.addEventListener('resize', adjustViewportHeight);
