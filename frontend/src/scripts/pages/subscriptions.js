import { renderLayout } from "../components/layout.js";
import { setSiderbarNavigation } from "../utils/animations/sideBarAnimation.js";
import { API_BASE_URL } from "../../config.js";

renderLayout("subscriptions");
setSiderbarNavigation();

const personBody = document.getElementById("subscriptions-person-body");
const familyBody = document.getElementById("subscriptions-family-body");

const LOADING_MESSAGE = "Loading plans...";
const EMPTY_MESSAGE = "No plans yet.";
const UNAVAILABLE_MESSAGE = "Pricing is temporarily unavailable. Please contact us to order.";

const formatNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildRowHtml = (plan, index) => {
  const rowClass = index % 2 === 0 ? "bg-surface" : "bg-background/60";
  const days = formatNumber(plan?.daysPerMonth);
  const platDuJour = formatNumber(plan?.platDuJour);
  const withSalad = formatNumber(plan?.withSalad);
  const daysLabel = days === null ? "—" : `${days} days`;

  return `
    <tr class="${rowClass}">
      <td class="px-4 py-3 border border-muted/30">${daysLabel}</td>
      <td class="px-4 py-3 border border-muted/30">${platDuJour ?? "—"}</td>
      <td class="px-4 py-3 border border-muted/30">${withSalad ?? "—"}</td>
    </tr>
  `;
};

const buildEmptyRowHtml = (message) => `
  <tr class="bg-surface">
    <td class="px-4 py-3 border border-muted/30 text-muted" colspan="3">${message}</td>
  </tr>
`;

const renderPlans = (tbody, plans, emptyMessage = EMPTY_MESSAGE) => {
  if (!tbody) return;
  const list = Array.isArray(plans) ? plans : [];
  if (!list.length) {
    tbody.innerHTML = buildEmptyRowHtml(emptyMessage);
    return;
  }
  tbody.innerHTML = list.map(buildRowHtml).join("");
};

const loadSubscriptionPlans = async () => {
  if (!personBody || !familyBody) return;

  renderPlans(personBody, [], LOADING_MESSAGE);
  renderPlans(familyBody, [], LOADING_MESSAGE);

  try {
    const response = await fetch(`${API_BASE_URL}/api/subscriptions`);
    if (!response.ok) {
      throw new Error(`Failed to load subscription plans: ${response.status}`);
    }

    const { data } = await response.json();
    const plans = Array.isArray(data) ? data : [];

    const planDay = (plan) => formatNumber(plan?.daysPerMonth) ?? Number.POSITIVE_INFINITY;

    const personPlans = plans
      .filter((plan) => (plan?.audience || "").toString().toLowerCase() === "person")
      .sort((a, b) => planDay(a) - planDay(b));
    const familyPlans = plans
      .filter((plan) => (plan?.audience || "").toString().toLowerCase() === "family")
      .sort((a, b) => planDay(a) - planDay(b));

    renderPlans(personBody, personPlans);
    renderPlans(familyBody, familyPlans);
  } catch (error) {
    console.warn("Subscriptions API unavailable.", error);
    renderPlans(personBody, [], UNAVAILABLE_MESSAGE);
    renderPlans(familyBody, [], UNAVAILABLE_MESSAGE);
  }
};

loadSubscriptionPlans();
