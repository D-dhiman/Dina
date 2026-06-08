import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-semibold text-gray-900 mb-3">
          Your health, simplified
        </h1>
        <p className="text-gray-500 text-base mb-8">
          Track your habits, journal your thoughts, and understand your patterns.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-emerald-700 transition"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}