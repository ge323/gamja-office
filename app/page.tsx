import GameWorld from "@/components/game/GameWorld";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f3ee] text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm font-semibold">
              Gamja Office
            </div>

            <div className="mt-1 text-[11px] text-zinc-400">
              Click to move prototype
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            online
          </div>
        </div>
      </header>

      <GameWorld />
    </main>
  );
}