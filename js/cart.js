let timeoutState = new Map();

function renderAddedMessage(messageElement) {
    // Clear any existing timeout and reset state
    if (timeoutState.has(messageElement)) {
        clearTimeout(timeoutState.get(messageElement));
    }

    // Add the "added to cart" class
    messageElement.classList.add("js-is-added-to-cart");

    // Set a new timeout to remove the class
    const timeoutId = setTimeout(() => {
        messageElement.classList.remove("js-is-added-to-cart");
        timeoutState.delete(messageElement);
    }, 1000);

    // Store the timeout ID in the Map
    timeoutState.set(messageElement, timeoutId);
}


// Get the heart icon element
const heartIcon = document.getElementById("heart-icon");

// Add event listener for click
heartIcon.addEventListener("click", function() {
    const path = heartIcon.querySelector("path");
    
    // Toggle the fill and stroke colors
    if (path.getAttribute("fill") === "red") {
        path.setAttribute("fill", "transparent");
        path.setAttribute("stroke", "black");
    } else {
        path.setAttribute("fill", "red");
        path.setAttribute("stroke", "red");
    }
});

const addToCartButtonElement = document.querySelectorAll(
    ".js-add-to-cart-button"
);

addToCartButtonElement.forEach((button) => {
    button.addEventListener("click", () => {
        const { productId } = button.dataset;
        const messageElement = document.querySelector(
        `.js-added-to-cart-${productId}`
        );
        renderAddedMessage(messageElement);
    });
});
