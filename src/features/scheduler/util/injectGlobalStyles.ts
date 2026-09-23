/**
 * injectGlobalStyles.ts
 * Injects keyframe animations and utility CSS once into the document head.
 * Call this at the top of PlanAndInventoryPage (or in a top-level useEffect).
 */
export const injectGlobalStyles = (): void => {
  if (document.getElementById("plan-page-styles")) return;

  const style = document.createElement("style");
  style.id = "plan-page-styles";
  style.textContent = `
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulseRing {
      0%   { box-shadow: 0 0 0 0   rgba(99,102,241,0.45); }
      70%  { box-shadow: 0 0 0 5px rgba(99,102,241,0);    }
      100% { box-shadow: 0 0 0 0   rgba(99,102,241,0);    }
    }

    /* Staggered card entrance */
    .crq-card { animation: fadeSlideIn 0.22s ease both; }
    .crq-card:nth-child(1) { animation-delay: 0.02s; }
    .crq-card:nth-child(2) { animation-delay: 0.05s; }
    .crq-card:nth-child(3) { animation-delay: 0.08s; }
    .crq-card:nth-child(4) { animation-delay: 0.11s; }
    .crq-card:nth-child(n+5) { animation-delay: 0.14s; }

    /* Smooth expand chevron rotation */
    .expand-chevron {
      transition: transform 0.22s cubic-bezier(.4,0,.2,1);
      display: flex;
    }
    .expand-chevron.open { transform: rotate(90deg); }

    /* Thin custom scrollbar inside MRT table */
    .plan-table-scroll::-webkit-scrollbar        { height: 5px; width: 5px; }
    .plan-table-scroll::-webkit-scrollbar-track  { background: transparent; }
    .plan-table-scroll::-webkit-scrollbar-thumb  { border-radius: 99px; }
  `;

  document.head.appendChild(style);
};