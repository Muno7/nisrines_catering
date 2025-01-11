// Function to toggle the sidebar visibility
function show(event) {
    event.stopPropagation(); // Prevent click from bubbling to the document listener

    const navigation = document.querySelector('.navigation');
    const hamburger = document.querySelector('.hamburger');

    // Toggle classes for the sidebar and hamburger button
    hamburger.classList.toggle('open');
    navigation.classList.toggle('left-0');
    navigation.classList.toggle('left-[-75%]');
    navigation.classList.toggle('md:left-[-50%]');
    navigation.classList.toggle('lg:left-[-33%]');

    // Toggle no-scroll class on the body
    if (navigation.classList.contains('left-0')) {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }
}

// Close the sidebar if clicking outside of it
document.addEventListener('click', function (event) {
    const navigation = document.querySelector('.navigation');
    const hamburger = document.querySelector('.hamburger');

    if (!navigation.contains(event.target) && !hamburger.contains(event.target)) {
        navigation.classList.remove('left-0');
        navigation.classList.add('left-[-75%]');
        navigation.classList.add('md:left-[-50%]');
        navigation.classList.add('lg:left-[-33%]');
        hamburger.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }
});

// Add click event listener to the hamburger button
const hamburgerButton = document.getElementById('hamburger-button');
hamburgerButton.addEventListener('click', show);

// Function to adjust the side-navbar height based on the viewport
function adjustViewportHeight() {
    const windowHeight = window.innerHeight;
    document.body.style.height = `${windowHeight}px`;

    const mainContent = document.querySelector('.side-bar-js');
    if (mainContent) {
        mainContent.style.height = `${windowHeight}px`;
    }
}
// Call the function on load and resize to handle different screen sizes
window.addEventListener('load', adjustViewportHeight);
window.addEventListener('resize', adjustViewportHeight);