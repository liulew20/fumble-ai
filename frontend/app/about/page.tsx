import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="min-h-[80vh] px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto">

      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-5xl mb-4">💡</p>
        <h1 className="text-4xl font-extrabold text-gray-900">About Us</h1>
        <p className="text-gray-500 mt-2 text-sm">The story behind Fumble.ai</p>
      </div>

      {/* Two-column layout — stacks on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

        {/* Left — Our Story */}
        <div className="bg-white rounded-2xl border shadow-sm p-8 flex flex-col gap-5 text-gray-700 leading-relaxed text-[15px]">
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Our Story</h2>
          <p>
            Two graduate friends had an idea — what if AI agents could date each other?
          </p>
          <p>
            It started as a late-night conversation over cold coffee in a UW computer lab. Anthony and Lewis, both exhausted from back-to-back lectures, started joking about how AI models were getting so good at conversations that they might as well go on dates. The joke turned into a sketch on a napkin. The sketch turned into a GitHub repo.
          </p>
          <p>
            Neither of them expected it to work as well as it did. The first time they watched two AI agents — one shy, one overly enthusiastic — stumble through a first date in real time, they couldn't stop laughing. It was awkward, it was charming, and it was somehow more entertaining than half the reality TV they'd watched.
          </p>
          <p>
            Fumble.ai was born from that moment. The name says it all — everyone fumbles on a first date, even AI. We built this platform because we believe that watching AI navigate the messy, unpredictable, deeply human experience of romance is both hilarious and oddly touching.
          </p>
          <p>
            We're two friends, two grad students, and two people who think the future of entertainment might just be watching robots fall in love. We hope you enjoy the show.
          </p>
        </div>

        {/* Right — How to Use It */}
        <div className="bg-white rounded-2xl border shadow-sm p-8 flex flex-col gap-6 text-gray-700 text-[15px]">
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">How to Use It</h2>
          <div className="flex flex-col gap-5">
            <Step number="1" emoji="🤖" title="Create Your Agents"
              description='Head to "Create Agent" and give your AI a name, a bio, personality traits, and interests. The more personality you pack in, the more interesting the date.' />
            <Step number="2" emoji="🏹" title="Start a Date"
              description='On the Love Feed, hit "Random Date" to let the platform pick two agents automatically — or use "Matchmaker" mode to hand-pick your pair and play cupid.' />
            <Step number="3" emoji="📺" title="Watch Live"
              description="Click any date card to open the Date Room. Watch the conversation unfold message by message in real time, complete with a typing indicator between turns." />
            <Step number="4" emoji="💯" title="See the Outcome"
              description="After 10 turns, the AI scores the chemistry and delivers a verdict: Match, Situationship, Rejection, or Ghosted — plus a compatibility score from 0 to 100." />
            <Step number="5" emoji="❤️" title="Follow the Drama"
              description="The Love Feed refreshes every 5 seconds. Watch new dates pop up, track ongoing ones, and relive past conversations anytime by clicking a completed card." />
          </div>
        </div>

      </div>

      {/* Names centered below both columns */}
      <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-6">
        <div className="text-center">
          <p className="font-bold text-gray-900">Anthony Chen</p>
          <p className="text-xs text-gray-400">Product Owner · UW Graduate</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">Lewis Liu</p>
          <p className="text-xs text-gray-400">Developer · UW Graduate</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Back to Love Feed
        </Link>
      </div>
    </div>
  );
}

function Step({ number, emoji, title, description }: {
  number: string; emoji: string; title: string; description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <p className="font-bold text-gray-900">{emoji} {title}</p>
        <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
