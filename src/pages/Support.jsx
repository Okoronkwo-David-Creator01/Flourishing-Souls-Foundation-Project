import React from "react";
import { Link } from "react-router-dom";
import SupportRequestForm from "../components/support/SupportRequestForm";

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col">
      <header className="w-full bg-white/85 dark:bg-slate-900/85 border-b border-slate-100 dark:border-slate-800 py-6 shadow-sm z-10">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Flourishing Souls Foundation Logo"
              className="w-11 h-11 rounded-full border-2 border-indigo-600 shadow bg-white"
              width={44}
              height={44}
              loading="lazy"
            />
            <span className="font-bold text-lg text-indigo-800 dark:text-white tracking-tight">
              Flourishing Souls Foundation
            </span>
          </Link>
          <nav className="space-x-4 text-sm font-medium hidden md:block">
            <Link to="/" className="hover:text-indigo-600 text-slate-700 dark:text-slate-200">
              Home
            </Link>
            <Link to="/donate" className="hover:text-indigo-600 text-slate-700 dark:text-slate-200">
              Donate
            </Link>
            <Link to="/volunteer" className="hover:text-indigo-600 text-slate-700 dark:text-slate-200">
              Volunteer
            </Link>
            <Link to="/events" className="hover:text-indigo-600 text-slate-700 dark:text-slate-200">
              Events
            </Link>
            <Link to="/gallery" className="hover:text-indigo-600 text-slate-700 dark:text-slate-200">
              Gallery
            </Link>
            <Link to="/support" className="text-indigo-600 underline dark:text-indigo-400">
              Support
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-md p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mb-2">
            Contact & Support
          </h1>
          <p className="text-gray-700 dark:text-slate-300 mb-8">
            Need help? Fill out the form below for all support requests, feedback, or partnership inquiries.
            Our team is here and will respond as soon as possible. For urgent matters, you can also email us at{" "}
            <a
              href="mailto:support@flourishingsoulsfoundation.org"
              className="underline text-indigo-500 hover:text-indigo-700"
            >
              support@flourishingsoulsfoundation.org
            </a>.
          </p>
          <section className="mb-10">
            <SupportRequestForm />
          </section>
          <div className="mt-10 bg-indigo-50 dark:bg-slate-700/70 rounded-lg p-4">
            <h2 className="font-semibold text-lg text-indigo-800 dark:text-indigo-200 mb-2">
              Frequently Asked Questions
            </h2>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-slate-200">
              <li>
                <span className="font-semibold">How soon will I get a response?</span>&nbsp;
                We typically answer support requests within 24-48 hours.
              </li>
              <li>
                <span className="font-semibold">Can I get support by phone?</span>&nbsp;
                At this time we offer support primarily by email and through this contact form. Urgent press or sponsorship requests will be prioritized.
              </li>
              <li>
                <span className="font-semibold">Can I request assistance for myself or someone else?</span>&nbsp;
                Absolutely. Please share as many details as possible so we can assess and respond.
              </li>
            </ul>
          </div>
        </div>
      </main>
      <footer className="w-full mt-10 flex flex-col items-center border-t border-slate-200 dark:border-slate-700 pt-6 pb-8 bg-white/90 dark:bg-gray-900/90">
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
          <Link to="/support" className="hover:text-indigo-500 underline">
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
};

export default Support;

