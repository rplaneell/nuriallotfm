import { PageHeader } from '@/components/ui';
import { literatureMeta, precedentMeta } from '@/lib/evidence';

export default function AboutPage() {
  return (
    <div className="prose-calm space-y-8">
      <PageHeader eyebrow="About" title="How this tool works, and what it cannot do" />
      <section><h2>What it is</h2><p className="mt-2">A local research notebook to help one student choose a master’s thesis topic and connect it to a first job. Everything you enter stays in your browser.</p></section>
      <section><h2>Official context (checked during development)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5"><li>Master in Governance, UPF: 60 ECTS; thesis 20 ECTS in the third term; Migration Studies track requires at least 15 ECTS of its electives.</li><li>Thesis: up to 10,000 words including references, article format, English; topic and two supervisor preferences in February; submission mid-June; defence late June or early July; 80% supervisor, 20% committee.</li><li>Dates change by year: enter the confirmed ones on the Shortlist page.</li></ul>
        <p className="mt-2"><a href="https://www.upf.edu/web/master-governance/academic-information" target="_blank" rel="noreferrer">Programme</a> · <a href="https://www.upf.edu/web/master-governance/master-thesis" target="_blank" rel="noreferrer">Thesis rules</a></p></section>
      <section><h2>What is evidence, and what is not</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5"><li><strong>Verified metadata:</strong> {literatureMeta.total} works from OpenAlex and {precedentMeta.total} past master’s theses from repositories, with retrieval dates. Existence was confirmed by the source returning them; relevance was not human-checked and abstracts were not read in full.</li><li><strong>Topic profiles, research questions, hypotheses and feasibility scores</strong> are generated or judged by the tool’s author. They are starting points. None is a confirmed gap in the literature.</li><li><strong>Place notes and legal or policy claims</strong> are written from background knowledge and flagged unverified; each lists what to check.</li></ul></section>
      <section><h2>Past theses: limits</h2><p className="mt-2">UPF’s repository holds only a few deposited master theses, so most precedents come from comparable programmes at other universities. Coverage is partial and the match to your question is a rough word-overlap signal.</p></section>
      <section><h2>Privacy and security</h2><ul className="mt-2 list-disc space-y-1 pl-5"><li>No analytics and no tracking. Answers, notes and shortlist live in this browser’s storage. If you choose to turn on saving (Settings), a copy is also stored online under a private recovery code that only you hold, so it follows you across devices. There is no email and no account. You can erase that copy at any time.</li><li>The optional local service only contacts public repositories and, if you add a key, an AI service. Keys stay on the server and never reach the browser.</li><li>Imported backups are validated; web content is treated as data, never as instructions.</li></ul></section>
      <section><h2>Honest limits</h2><ul className="mt-2 list-disc space-y-1 pl-5"><li>The test describes stated preferences. It does not predict success and it is not a personality type.</li><li>Careers are illustrative. No vacancies are listed.</li><li>Map coverage is a curated sample; the comparison is descriptive and says nothing about cause.</li></ul></section>
    </div>
  );
}
