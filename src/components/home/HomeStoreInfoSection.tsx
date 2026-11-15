"use client";

import { useState } from "react";

export function HomeStoreInfoSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
    }
  };

  return (
    <section id="about" className="w-full border-t line bg-[color:var(--bg)] scroll-mt-20">
      <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
        {/* Left Column: Stay Connected */}
        <div className="flex flex-col max-w-lg">
          <span className="text-[11px] tracking-[0.3em] uppercase mute mb-3 font-medium">
            Stay Connected
          </span>
          <h2 className="serif text-3xl md:text-4xl lg:text-5xl mb-4 text-[color:var(--fg)]">
            Stay in the TAGE Edit
          </h2>
          <p className="mute text-sm mb-8 leading-relaxed">
            New deliveries, seasonal editorials and 10% off your first purchase.
          </p>

          {subscribed ? (
            <p className="text-sm py-3 text-emerald-700 bg-emerald-50 border border-emerald-200 px-4">
              Thank you — you’re on the TAGE list.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex border-b border-current">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 min-w-0 bg-transparent py-3 outline-none text-sm placeholder:text-[color:var(--mute)]"
              />
              <button
                type="submit"
                className="text-xs tracking-[0.25em] uppercase px-3 hover:opacity-75 transition-opacity"
              >
                Subscribe →
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Store Addresses & Hours */}
        <div className="flex flex-col md:border-l line md:pl-12 lg:pl-16 space-y-8 text-sm">
          <div>
            <h3 className="text-xs tracking-[0.3em] uppercase font-semibold text-[color:var(--fg)] mb-5">
              ADDRESS
            </h3>
            <div className="space-y-5 mute leading-relaxed">
              <div>
                <span className="text-[color:var(--fg)] font-medium block text-xs tracking-wider uppercase mb-1">
                  Store 01
                </span>
                <p>107 Ton That Dam, Sai Gon Ward, Ho Chi Minh City, Vietnam</p>
              </div>
              <div>
                <span className="text-[color:var(--fg)] font-medium block text-xs tracking-wider uppercase mb-1">
                  Store 02
                </span>
                <p>41 Phan Diet Duat, Tan Dinh Ward, Ho Chi Minh City, Vietnam</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t line">
            <h3 className="text-xs tracking-[0.3em] uppercase font-semibold text-[color:var(--fg)] mb-3">
              STORE HOURS
            </h3>
            <p className="mute leading-relaxed">
              9:00 AM – 9:00 PM · Open Daily (Monday – Sunday)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

