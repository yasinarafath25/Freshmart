"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

export type Slide = { title: string; accent: string; subtitle: string; cta: { href: string; label: string }; image: string; alt: string; seal?: [string, string]; photo?: boolean; focus?: string };

export function HeroCarousel({ slides, label }: { slides: Slide[]; label: string }) {
  const { d, num } = useI18n();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#e9f5df] via-[#f4faee] to-[#d4ecc4]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      {/* soft bokeh + wooden table */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-10 top-10 size-72 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute right-1/4 -top-10 size-80 rounded-full bg-leaf-400/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-[#c99b66] to-[#a9773f] opacity-90 sm:h-20" />
        <div className="absolute inset-x-0 bottom-16 h-2 bg-[#e3bf8f] sm:bottom-20" />
      </div>
      {slides.map((s, idx) => (
        <div
          key={idx}
          role="group"
          aria-roledescription="slide"
          aria-label={`${num(idx + 1)} / ${num(slides.length)}`}
          aria-hidden={idx !== i}
          className={`grid min-h-[420px] items-center gap-4 px-6 pb-20 pt-8 transition-opacity duration-500 sm:px-10 md:min-h-[360px] md:grid-cols-[1fr_1.15fr] lg:min-h-[400px] lg:px-16 ${idx === i ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
        >
          <div className="relative z-10 max-w-xl">
            <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
              {s.title}
              <span className="mt-2 block text-[26px] text-brand-700 sm:text-4xl lg:text-[44px]">{s.accent}</span>
            </h1>
            <p className="mt-3 text-lg font-semibold text-ink-900 sm:text-xl">{s.subtitle}</p>
            <Link
              href={s.cta.href}
              tabIndex={idx === i ? 0 : -1}
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand-700 px-7 text-base font-semibold text-white shadow-lg shadow-brand-900/20 transition hover:bg-brand-800"
            >
              {s.cta.label} <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
          <div className={`relative flex items-end justify-center ${s.photo ? "" : "-mb-6 md:mb-0"}`}>
            {s.photo ? (
              <div className="h-56 w-full max-w-[600px] overflow-hidden rounded-[20px] border-4 border-white shadow-xl sm:h-72 lg:h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.alt} width={960} height={720} loading={idx === 0 ? "eager" : "lazy"} fetchPriority={idx === 0 ? "high" : undefined} decoding="async" className="size-full object-cover" style={{ objectPosition: s.focus ?? "center" }} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt={s.alt} width={800} height={400} loading={idx === 0 ? "eager" : "lazy"} fetchPriority={idx === 0 ? "high" : undefined} className="w-full max-w-[640px] drop-shadow-xl" />
            )}
            {s.seal && (
              <div className="absolute -top-2 right-0 hidden size-28 place-items-center rounded-full border-4 border-white bg-brand-700 text-center text-white shadow-xl sm:grid lg:size-32">
                <span className="font-display text-2xl font-extrabold leading-none lg:text-3xl">
                  {s.seal[0]}
                  <span className="block text-xl lg:text-2xl">{s.seal[1]}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            aria-label={d.hero.goTo(idx + 1)}
            aria-current={idx === i}
            className={`h-3 rounded-full transition-all ${idx === i ? "w-8 bg-brand-700" : "w-3 bg-white shadow"}`}
          />
        ))}
        <button onClick={() => setPaused((p) => !p)} className="ml-2 grid size-7 place-items-center rounded-full bg-white/90 text-brand-900 shadow" aria-label={paused ? d.hero.play : d.hero.pause}>
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </button>
      </div>
    </section>
  );
}
