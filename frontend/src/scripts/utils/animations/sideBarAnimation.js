const activePanels = new Map();
let overlayElement = null;

const noopControls = { open: () => {}, close: () => {}, isOpen: () => false };

function ensureOverlayElement() {
  if (overlayElement) return overlayElement;

  const existingOverlay = document.getElementById('sidebar-overlay');
  overlayElement = existingOverlay || document.createElement('div');
  overlayElement.id = 'sidebar-overlay';
  overlayElement.classList.add('sidebar-overlay');

  if (!overlayElement.dataset.bound) {
    overlayElement.addEventListener('click', (event) => {
      event.stopPropagation();
      closeAllPanels();
    });
    overlayElement.dataset.bound = 'true';
  }

  if (!existingOverlay) {
    document.body.appendChild(overlayElement);
  }

  return overlayElement;
}

function showOverlay() {
  const overlay = ensureOverlayElement();
  overlay.classList.add('sidebar-overlay--visible');
}

function hideOverlayIfIdle() {
  if (!activePanels.size && overlayElement) {
    overlayElement.classList.remove('sidebar-overlay--visible');
  }
}

function updateBodyScrollLock() {
  if (activePanels.size) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
}

function closeAllPanels(exceptPanel) {
  Array.from(activePanels.entries()).forEach(([panelRef, closeFn]) => {
    if (panelRef !== exceptPanel) closeFn();
  });
}

export function bindSlidingPanel({
  buttonSelector,
  panelSelector,
  toggleTargetSelector,
  openPositionClass = 'left-0',
  closedPositionClasses = ['left-[-75%]', 'md:left-[-50%]', 'lg:left-[-33%]'],
  openToggleClass = 'open'
}) {
  const buttons = Array.from(document.querySelectorAll(buttonSelector));
  const panel = document.querySelector(panelSelector);
  const toggleTargets = toggleTargetSelector ? Array.from(document.querySelectorAll(toggleTargetSelector)) : [];
  if (!buttons.length || !panel) return noopControls;

  ensureOverlayElement();

  const isPanelOpen = () => panel.classList.contains(openPositionClass);

  const closePanel = () => {
    panel.classList.remove(openPositionClass);
    closedPositionClasses.forEach((cls) => panel.classList.add(cls));
    toggleTargets.forEach((target) => target.classList.remove(openToggleClass));
    activePanels.delete(panel);
    updateBodyScrollLock();
    hideOverlayIfIdle();
  };

  const openPanel = () => {
    closeAllPanels(panel);
    panel.classList.add(openPositionClass);
    closedPositionClasses.forEach((cls) => panel.classList.remove(cls));
    toggleTargets.forEach((target) => target.classList.add(openToggleClass));
    activePanels.set(panel, closePanel);
    showOverlay();
    updateBodyScrollLock();
  };

  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (isPanelOpen()) {
        closePanel();
      } else {
        openPanel();
      }
    });
  });

  document.addEventListener('click', (event) => {
    const clickedButton = buttons.some((btn) => btn.contains(event.target));
    if (!panel.contains(event.target) && !clickedButton) {
      closePanel();
    }
  });

  return { open: openPanel, close: closePanel, isOpen: isPanelOpen };
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
    buttonSelector: '.js-hamburger-toggle',
    panelSelector: '.navigation',
    toggleTargetSelector: '.hamburger'
  });
}
