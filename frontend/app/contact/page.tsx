import Link from "next/link";

export default function ContactPage() {
  const developers = [
    { name: "Anthony Chen", email: "aechen@uw.edu", role: "Product Owner" },
    { name: "Lewis Liu", email: "lewisliu@uw.edu", role: "Developer" },
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-3 sm:px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">💬</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Contact the Team</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Have a question or need help? Reach out to us directly.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {developers.map((dev) => (
            <div
              key={dev.email}
              className="rounded-2xl border bg-white p-5 shadow-sm flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 shrink-0">
                {dev.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{dev.name}</p>
                <p className="text-xs text-gray-400 mb-1">{dev.role}</p>
                <a
                  href={`mailto:${dev.email}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all"
                >
                  {dev.email}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Back to Love Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
