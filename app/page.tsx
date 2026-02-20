import Link from "next/link";

const VERSIONS = [
  {
    version: "v3",
    label: "v3.0.0",
    description: "Auto-play loop (▶ Play button), Select All/None elements, presets apply to all elements, auto-parse SVG on paste, Download .tsx, fully English UI, and refactored preview component.",
    date: "2026-02-20",
    latest: true,
  },
  {
    version: "v2",
    label: "v2.0.0",
    description: "English UI, ring/shake effect, 3D transforms (perspective, rotateX/Y), skew, blur, stroke/fill color animation, and animation delay controls.",
    date: "2026-02-15",
    latest: false,
  },
  {
    version: "v1",
    label: "v1.0.0",
    description: "Initial release — SVG parsing, per-element animation controls, drag-to-move, frame settings, and motion/react code export.",
    date: "2026-02-15",
    latest: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center text-white text-base font-bold">
            ✦
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Icon Animator</h1>
            <p className="text-xs text-zinc-500">
              Paste SVG → Animate visually → Copy ready React component
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6">
            Versions
          </h2>

          <div className="space-y-3">
            {VERSIONS.map((v) => (
              <Link
                key={v.version}
                href={`/${v.version}`}
                className="block group border border-zinc-800 rounded-xl p-5 hover:border-violet-500/60 hover:bg-zinc-900/60 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-violet-400 font-mono">
                    {v.label}
                  </span>
                  {v.latest && (
                    <span className="text-[9px] uppercase tracking-widest bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full">
                      Latest
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-600 ml-auto">
                    {v.date}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {v.description}
                </p>
                <span className="text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2 inline-block">
                  Open editor →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 text-center">
        <p className="text-[10px] text-zinc-600">
          Inspired by{" "}
          <a
            href="https://github.com/itshover/itshover"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:underline"
          >
            itshover.com
          </a>
          {" "}· MIT License
        </p>
      </footer>
    </div>
  );
}
