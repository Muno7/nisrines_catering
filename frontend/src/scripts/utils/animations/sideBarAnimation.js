export function bindSlidingPanel({
    buttonSelector,
    panelSelector,
    toggleTargetSelector,
    openPositionClass = 'left-0',
    closedPositionClasses = ['left-[-75%]', 'md:left-[-50%]', 'lg:left-[-33%]'],
    openToggleClass = 'open'
  }) {
    const button = document.querySelector(buttonSelector);
    const panel = document.querySelector(panelSelector);
    const toggleTarget = toggleTargetSelector ? document.querySelector(toggleTargetSelector) : null;
    if (!button || !panel) return;

    const openPanel = () => {
      panel.classList.add(openPositionClass);
      closedPositionClasses.forEach((cls) => panel.classList.remove(cls));
      if (toggleTarget) toggleTarget.classList.add(openToggleClass);
      document.body.classList.add('no-scroll');
    };

    const closePanel = () => {
      panel.classList.remove(openPositionClass);
      closedPositionClasses.forEach((cls) => panel.classList.add(cls));
      if (toggleTarget) toggleTarget.classList.remove(openToggleClass);
      document.body.classList.remove('no-scroll');
    };

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = panel.classList.contains(openPositionClass);
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
      }
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && !button.contains(event.target)) {
        closePanel();
      }
    });
}

export function setSiderbarNavigation() {
    function adjustViewportHeight() {
        const windowHeight = window.innerHeight;
        document.body.style.height = `${windowHeight}px`;

        document.querySelectorAll('.side-bar-js, .filter-bar-js').forEach((panel) => {
            panel.style.height = `${windowHeight}px`;
        });
    }
    window.addEventListener('load', adjustViewportHeight);
    window.addEventListener('resize', adjustViewportHeight);

    bindSlidingPanel({
        buttonSelector: '#hamburger-button',
        panelSelector: '.navigation',
        toggleTargetSelector: '.hamburger'
    });
}
