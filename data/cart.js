let timeoutState = new Map();

export function renderAddedMessage(messageElement) {
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



