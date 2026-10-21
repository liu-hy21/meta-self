export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-4">
      <h2 className="text-base font-semibold text-[#111827]">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      ) : null}
    </header>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pixel-box p-4">
      <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function fieldClass() {
  return "mt-1 block w-full min-h-11 border-2 border-[var(--ink)] bg-[var(--panel)] px-3 text-sm shadow-[inset_2px_2px_0_#d9cbb3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]";
}

export function labelClass() {
  return "text-xs font-medium text-[#374151]";
}

const buttonSize = "inline-flex h-8 items-center justify-center px-3 text-sm leading-none";

export function submitClass() {
  return `${buttonSize} border-2 border-[var(--ink)] bg-[var(--gold)] text-[var(--ink)] shadow-[4px_4px_0_var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]`;
}

export const backClass = `${buttonSize} border-2 border-[var(--ink)] bg-[var(--panel)] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]`;

/** 主内容区：与厨房/家务 `.q-page` 一致的宽度与区块间距（见 globals.css） */
export const pageWrap = "q-page";

/** @deprecated 与 {@link pageWrap} 相同，保留别名避免大范围改名 */
export const pageWrapDashboard = pageWrap;

export const pageWrapKitchen = "q-kitchen q-page";
export const pageWrapHome = "q-home q-page";
