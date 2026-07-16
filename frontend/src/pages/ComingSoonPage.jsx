import PageShell from "../components/PageShell";
import { EndlessKnot } from "../components/TibetanMotif";

export default function ComingSoonPage({ title }) {
  return (
    <PageShell title={title}>
      <div className="bg-white rounded-2xl border border-saffron-200 p-12 text-center">
        <EndlessKnot className="w-12 h-12 mx-auto text-saffron-300 mb-4" />
        <p className="text-maroon-500">This section is on its way — coming soon.</p>
      </div>
    </PageShell>
  );
}
