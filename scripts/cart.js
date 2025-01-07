let timeoutState = new Map();

function renderAddedMessage(messageElement) {
    if (timeoutState.has(messageElement)) {
        clearTimeout(timeoutState.get(messageElement));
    }
    messageElement.classList.add("js-is-added-to-cart");

    const timeoutId = setTimeout(() => {
        messageElement.classList.remove("js-is-added-to-cart");
        timeoutState.delete(messageElement);
    }, 1000);

    timeoutState.set(messageElement, timeoutId);
}

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

