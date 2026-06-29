import { SupabaseStatus } from "@/components/SupabaseStatus";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-5xl font-bold tracking-tight">Hello World</h1>
        <p className="text-lg text-zinc-500">RoadTrip Trivia — scaffold is live.</p>
      </div>
      <SupabaseStatus />
    </div>
  );
}
