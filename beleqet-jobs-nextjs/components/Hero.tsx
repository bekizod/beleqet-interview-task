"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, ShieldCheck, BellRing, Send } from "lucide-react";
import { popularSearches } from "@/lib/mockData";

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("loc", location);
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary2 to-darkGreen text-white">
  <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.25),transparent_40%),radial-gradient(circle_at_85%_75%,rgba(56,189,248,0.18),transparent_45%)]" />

  <div className="container-page relative py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
    <div>
      <h1 className="text-hero">
        Find Your Next <span className="text-success">Opportunity</span> Faster.
      </h1>
      <p className="mt-5 text-white/70 max-w-md text-base leading-relaxed">
        Discover thousands of verified job opportunities across Ethiopia. Search, apply, and get hired faster with
        the Beleqet Vacancy Platform.
      </p>

      <form
        onSubmit={handleSearch}
        className="mt-8 bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-cardHover"
      >
        <div className="flex items-center flex-1 gap-2 px-3 py-2 rounded-xl">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, keyword or company"
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
        </div>
        <div className="hidden sm:block w-px bg-border my-1" />
        <div className="flex items-center flex-1 gap-2 px-3 py-2 rounded-xl">
          <MapPin className="h-4 w-4 text-muted shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location e.g. Addis Ababa"
            className="w-full text-sm text-ink placeholder:text-muted outline-none"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 inline-flex items-center justify-center rounded-xl bg-brandGreen px-6 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
        >
          Search Jobs
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/60">
        <span>Popular Searches:</span>
        {popularSearches.map((term) => (
          <button
            key={term}
            onClick={() => router.push(`/jobs?q=${encodeURIComponent(term)}`)}
            className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10 transition-colors"
          >
            {term}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          <div className="text-xs leading-tight">
            <p className="font-semibold">Verified & Trusted</p>
            <p className="text-white/50">100% verified job listings</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
          <BellRing className="h-4 w-4 text-cyanAccent shrink-0" />
          <div className="text-xs leading-tight">
            <p className="font-semibold">Real-time Alerts</p>
            <p className="text-white/50">Get instant job updates</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-3">
          <Send className="h-4 w-4 text-cyanAccent shrink-0" />
          <div className="text-xs leading-tight">
            <p className="font-semibold">Telegram Notifications</p>
            <p className="text-white/50">Never miss an opportunity</p>
          </div>
        </div>
      </div>
    </div>

    {/* Image Section - Replaces the mobile app preview */}
    <div className="relative hidden md:block">
      <div className="aspect-[4/5] rounded-3xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 overflow-hidden relative group">
        {/* Background Image */}
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSNVsxP6zINzFn-0qCbJETVuz7n9NUzwhqwaXKWsb1MA&s=10"
          alt="Beleqet Job Vacancy Platform"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"%3E%3Crect width="400" height="500" fill="%231a1a2e"/%3E%3Ctext x="50" y="250" font-family="Arial" font-size="20" fill="%23ffffff80" text-anchor="middle"%3EJob Platform Preview%3C/text%3E%3C/svg%3E';
          }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Floating Elements */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium">Active Jobs</p>
                <p className="text-white text-2xl font-bold">2,847+</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs font-medium">Companies</p>
                <p className="text-white text-2xl font-bold">1,203</p>
              </div>
            </div>
          </div>
        </div>

        

        {/* Decorative Badge - Top Right */}
        <div className="absolute top-4 right-4 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 rounded-full px-4 py-1.5">
          <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
            <Send className="h-3 w-3" />
            New Jobs Daily
          </p>
        </div>
      </div>

      {/* Floating Notification Card */}
      <div className="absolute top-12 -left-6 rounded-xl bg-white text-ink px-4 py-3 shadow-cardHover text-xs w-44 animate-bounce-slow">
        <p className="font-semibold flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5 text-cyanAccent" /> New Job Alert!
        </p>
        <p className="text-muted mt-0.5">UI/UX Designer · Addis Ababa</p>
      </div>

      {/* Floating Stats Card - Bottom Left */}
      <div className="absolute bottom-32 -left-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 border-2 border-white/20 flex items-center justify-center text-[8px] font-bold">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span className="text-white/70">+12 applied today</span>
        </div>
      </div>

      {/* Floating Card - Right */}
      <div className="absolute top-1/3 -right-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 text-white text-xs max-w-32">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-success" />
          <span>Top companies hiring</span>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
