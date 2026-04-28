import VisitorForm from "../components/VisitorForm";

export default function VisitorPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Visitor Check-In</h2>
      <VisitorForm />
    </div>
  );
}