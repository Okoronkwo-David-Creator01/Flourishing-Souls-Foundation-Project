import React, { Suspense } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Lazy loaded components for improved performance
const EventList = React.lazy(() => import("../components/events/EventList"));
const GalleryGrid = React.lazy(() => import("../components/gallery/GalleryGrid"));

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <header className="relative w-full overflow-hidden bg-gradient-to-tr from-indigo-600/90 via-indigo-700/80 to-sky-800 pb-16">
        <div className="container mx-auto px-6 py-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          <div className="flex-1 z-10">
            <h1 className="text-white text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
              Flourishing Souls Foundation
            </h1>
            <p className="mt-5 text-lg text-indigo-100 font-medium max-w-xl drop-shadow">
              Empowering lives, nurturing hope, and building thriving communities.
            </p>
            <nav className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/donate"
                className="inline-block px-6 py-3 rounded bg-indigo-50 hover:bg-white text-indigo-700 font-extrabold shadow transition focus:ring-2 ring-indigo-500"
                aria-label="Donate to our Cause"
              >
                Donate Now
              </Link>
              <Link
                to="/volunteer"
                className="inline-block px-6 py-3 rounded bg-white/10 hover:bg-white/20 text-white font-semibold border border-indigo-100 shadow transition"
                aria-label="Become a Volunteer"
              >
                Volunteer
              </Link>
              <Link
                to="/events"
                className="inline-block px-6 py-3 rounded bg-white/5 hover:bg-white/10 text-white font-semibold border border-indigo-100 shadow transition"
                aria-label="Upcoming Events"
              >
                Events
              </Link>
            </nav>
            {user ? (
              <div className="mt-6 text-sm text-white/90 flex items-center gap-2 drop-shadow">
                <span>
                  Welcome back,{" "}
                  <span className="font-bold">{user.name || user.email}</span>!
                </span>
                <Link
                  to="/dashboard"
                  className="underline hover:text-yellow-300"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="mt-6 text-sm text-white/80 flex gap-2">
                <Link to="/login" className="underline hover:text-yellow-300">
                  Sign In
                </Link>
                <span className="mx-0.5">|</span>
                <Link to="/register" className="underline hover:text-indigo-200">
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="flex-1 flex justify-center lg:justify-end relative z-0">
            <img
              src="/images/hero/impact-group.webp"
              alt="Flourishing Souls - Hero Impact"
              className="w-[370px] md:w-[420px] max-w-full h-auto rounded-2xl shadow-2xl ring-4 ring-white/30 dark:ring-indigo-500/30"
              loading="eager"
              width={420}
              height={360}
              onError={e => { e.target.src = "/images/logo.png"; }}
            />
            <div className="hidden md:block absolute -bottom-10 -right-8">
              <img
                src="/images/logo.png"
                alt="Flourishing Souls Foundation Logo"
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-white dark:bg-slate-700"
                loading="lazy"
                width={112}
                height={112}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-10">
        {/* Organizational Impact Section */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 text-center border border-gray-100 dark:border-slate-700">
            <img
              src="/images/illustrations/growth.svg"
              alt=""
              className="mx-auto mb-3 w-16 h-16"
              width={64}
              height={64}
              loading="lazy"
            />
            <h2 className="font-bold text-lg text-indigo-600 mb-2">
              Empowerment
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              Supporting individuals to realize their full potential through education, mentorship, and financial aid.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 text-center border border-gray-100 dark:border-slate-700">
            <img
              src="/images/illustrations/community.svg"
              alt=""
              className="mx-auto mb-3 w-16 h-16"
              width={64}
              height={64}
              loading="lazy"
            />
            <h2 className="font-bold text-lg text-indigo-600 mb-2">
              Community Outreach
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              We mobilize resources and join hands to uplift local communities through sustainable programs.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 text-center border border-gray-100 dark:border-slate-700">
            <img
              src="/images/illustrations/aid.svg"
              alt=""
              className="mx-auto mb-3 w-16 h-16"
              width={64}
              height={64}
              loading="lazy"
            />
            <h2 className="font-bold text-lg text-indigo-600 mb-2">
              Real Impact
            </h2>
            <p className="text-gray-700 dark:text-slate-300">
              Transparent, measurable, and timely interventions change lives for the better—no empty promises.
            </p>
          </div>
        </section>
        {/* Recent Events */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800 dark:text-indigo-200">
            Recent & Upcoming Events
          </h2>
          <Suspense fallback={<div className="text-center py-6 text-indigo-300">Loading events…</div>}>
            <EventList limit={4} showPast={false} />
          </Suspense>
          <div className="flex justify-end mt-2">
            <Link
              to="/events"
              className="text-indigo-600 hover:underline text-sm font-medium"
              aria-label="View all events"
            >
              View all events &rarr;
            </Link>
          </div>
        </section>
        {/* Highlight: Donate/Join/Support */}
        <section className="my-14 rounded-xl bg-gradient-to-r from-indigo-50 via-indigo-100 to-slate-50 dark:bg-gradient-to-br dark:from-indigo-950/60 dark:via-indigo-900/30 dark:to-gray-900 p-8 flex flex-col sm:flex-row items-center gap-8 shadow-lg border border-indigo-50 dark:border-indigo-900/30">
          <div className="flex-1 mb-6 sm:mb-0">
            <h3 className="text-xl font-extrabold text-indigo-700 dark:text-indigo-200 mb-2">
              Make a Real Difference Today
            </h3>
            <p className="text-gray-700 dark:text-indigo-100 mb-4">
              100% of donations and volunteer work directly impact lives in need. Secure. Transparent. Immediate.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/donate"
                className="bg-indigo-600 text-white px-6 py-2 rounded font-semibold shadow hover:bg-indigo-700 transition"
                aria-label="Donate securely"
              >
                Donate Now
              </Link>
              <Link
                to="/volunteer"
                className="bg-white border border-indigo-500 text-indigo-700 px-6 py-2 rounded font-semibold shadow hover:bg-indigo-50 transition"
                aria-label="Become Volunteer"
              >
                Join as Volunteer
              </Link>
              <Link
                to="/support"
                className="bg-white border border-gray-400 text-gray-700 px-6 py-2 rounded font-semibold shadow hover:bg-gray-50 transition"
                aria-label="Get Support"
              >
                Get Support
              </Link>
            </div>
          </div>
          <div className="hidden lg:block flex-1">
            <img
              src="/images/illustrations/donate-support.svg"
              alt="Donate and Support illustration"
              className="max-w-xs w-full h-auto"
              loading="lazy"
              width={240}
              height={200}
            />
          </div>
        </section>
        {/* Recent Gallery */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-4 text-indigo-800 dark:text-indigo-200">
            Gallery Highlights
          </h2>
          <Suspense fallback={<div className="text-center py-6 text-indigo-300">Loading gallery…</div>}>
            <GalleryGrid limit={6} isHome={true} />
          </Suspense>
          <div className="flex justify-end mt-2">
            <Link
              to="/gallery"
              className="text-indigo-600 hover:underline text-sm font-medium"
              aria-label="View full gallery"
            >
              View full gallery &rarr;
            </Link>
          </div>
        </section>
        {/* Mission Statement Section */}
        <section className="my-14 px-6 py-10 rounded-xl bg-white/80 dark:bg-slate-800/60 shadow border border-gray-100 dark:border-slate-800 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-3 text-indigo-700 dark:text-indigo-200">
            Our Mission
          </h2>
          <p className="text-lg text-gray-800 dark:text-slate-200">
            To transform lives and communities through committed service, sustainable development, and transparent giving, ensuring every soul flourishes to their full potential.
          </p>
        </section>
        {/* Partners and Supporters */}
        <section className="mt-16 mb-4 px-2">
          <h3 className="text-base text-slate-500 font-semibold text-center mb-2">Proudly Supported By</h3>
          <div className="flex justify-center items-center flex-wrap gap-6">
            <img
              src="/images/brand-assets/paystack-logo.svg"
              alt="Paystack"
              className="h-8"
              height={32}
              loading="lazy"
            />
            <img
              src="/images/brand-assets/supabase-logo.svg"
              alt="Supabase"
              className="h-8"
              height={32}
              loading="lazy"
            />
            {/* Add more logos as appropriate */}
          </div>
        </section>
      </main>
      <footer className="w-full mt-12 flex flex-col items-center border-t border-slate-200 dark:border-slate-700 pt-6 pb-8 bg-white/90 dark:bg-gray-900/90">
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-indigo-500 transition"
        >
          &copy; {new Date().getFullYear()} Flourishing Souls Foundation
        </Link>
        <nav className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
          <Link to="/gallery" className="hover:text-indigo-500">
            Gallery
          </Link>
          <Link to="/events" className="hover:text-indigo-500">
            Events
          </Link>
          <Link to="/donate" className="hover:text-indigo-500">
            Donate
          </Link>
          <Link to="/volunteer" className="hover:text-indigo-500">
            Volunteer
          </Link>
          <Link to="/support" className="hover:text-indigo-500">
            Support
          </Link>
          <a
            href="mailto:support@flourishingsoulsfoundation.org"
            className="hover:text-indigo-500"
          >
            Contact
          </a>
        </nav>
      </footer>
    </div>
  );
}

