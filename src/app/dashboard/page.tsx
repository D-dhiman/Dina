import Navbar from "../components/navbar";

const sections = [
  {
    title: "Journal",
    description: "Capture your thoughts and reflections",
    pill: "0 entries today",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Habits",
    description: "Build and maintain your daily habits",
    pill: "3 / 5 done",
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "Dailies",
    description: "Your recurring daily tasks and check-ins",
    pill: "2 pending",
    color: "bg-amber-50 text-amber-700",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Good morning 👋</h1>
        <p className="text-gray-500 text-sm mb-6">Here's your overview for today</p>

        <div className="grid grid-cols-3 gap-4">
          {sections.map((s) => (
            <div
              key={s.title}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h2 className="font-medium text-gray-900 mb-1">{s.title}</h2>
              <p className="text-sm text-gray-500 mb-3">{s.description}</p>
              <span className={`text-xs px-2.5 py-1 rounded-full ${s.color}`}>
                {s.pill}
              </span>
            </div>
          ))}
        </div>
      </main>
      <Navbar />
    </div>
  );
}