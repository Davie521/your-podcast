import { BottomNav } from '@/components/BottomNav';

export default function ShowsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto max-w-[428px] px-6 pt-6 pb-24">
        <h1 className="font-serif text-4xl leading-10 text-[#111]">My Shows</h1>
        <p className="font-[family-name:var(--font-inter)] text-sm text-[#666] mt-6">
          Coming soon.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
