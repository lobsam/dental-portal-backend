import TopBar from "./TopBar";
import { CloudDivider } from "./TibetanMotif";

export default function PageShell({ title, actions, children }) {
  return (
    <>
      <TopBar title={title} />
      <CloudDivider className="h-2 w-full text-saffron-300/60 shrink-0" />
      <main className="flex-1 overflow-y-auto p-6">
        {actions && <div className="mb-6 flex items-center justify-between">{actions}</div>}
        {children}
      </main>
    </>
  );
}
