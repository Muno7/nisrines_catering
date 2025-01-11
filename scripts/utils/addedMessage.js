export let timeoutState = new Map();
export function renderAddedMessage(messageElement) {
    if (timeoutState.has(messageElement)) {
        clearTimeout(timeoutState.get(messageElement));
    }
    messageElement.classList.add("opacity-1");
    messageElement.classList.remove("opacity-0");

    const timeoutId = setTimeout(() => {
        messageElement.classList.remove("opacity-1");
        messageElement.classList.add("opacity-0");
        timeoutState.delete(messageElement);
    }, 1000);

    timeoutState.set(messageElement, timeoutId);
}