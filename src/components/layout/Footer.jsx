import React from "react";
import { Link } from "react-router-dom";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://facebook.com/flourishingsoulsfoundation",
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.406.593 24 1.325 24h11.495v-9.294H9.692V11.01h3.128V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.92.001c-1.504 0-1.796.715-1.796 1.763v2.314h3.587l-.467 3.697H16.56V24h6.115C23.406 24 24 23.406 24 22.674V1.326C24 .594 23.406 0 22.675 0"/>
      </svg>
    )
  },
  {
    name: "Instagram",
    href: "https://instagram.com/flourishingsoulsfoundation",
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm7.25 2a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm-4 2.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>
      </svg>
    )
  },
  {
    name: "Twitter",
    href: "https://twitter.com/floursoulsfdn",
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M22.46 5.924c-.793.352-1.644.59-2.538.697a4.484 4.484 0 0 0 1.963-2.475 8.936 8.936 0 0 1-2.831 1.082 4.467 4.467 0 0 0-7.606 4.073C7.69 9.109 4.067 7.23 1.64 4.151a4.48 4.48 0 0 0-.601 2.244c0 1.548.788 2.915 1.987 3.719a4.456 4.456 0 0 1-2.025-.56v.056a4.486 4.486 0 0 0 3.581 4.389 4.49 4.49 0 0 1-2.02.077 4.485 4.485 0 0 0 4.187 3.117A8.965 8.965 0 0 1 2 19.54a12.686 12.686 0 0 0 6.88 2.023c8.264 0 12.788-6.843 12.788-12.777 0-.195-.005-.39-.014-.583A9.14 9.14 0 0 0 24 4.59a8.8 8.8 0 0 1-2.54.697z"/>
      </svg>
    )
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/flourishingsoulsfoundation",
    icon: (
      <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M22.23 0H1.77A1.77 1.77 0 0 0 0 1.77V22.23A1.77 1.77 0 0 0 1.77 24H22.23A1.77 1.77 0 0 0 24 22.23V1.77A1.77 1.77 0 0 0 22.23 0zM7.09 20.45H3.56V9h3.53zm-1.77-13A2.05 2.05 0 1 1 7.36 5.4a2.05 2.05 0 1 1-2.04-2.05zM20.45 20.45h-3.53v-5.65c0-1.35-.03-3.08-1.88-3.08-1.89 0-2.18 1.48-2.18 3v5.73h-3.53V9h3.39v1.56h.05a3.72 3.72 0 0 1 3.35-1.84c3.58 0 4.24 2.36 4.24 5.43z"/>
      </svg>
    )
  }
];

const footerNav = [
  {
    label: "About Us",
    href: "/about"
  },
  {
    label: "Donate",
    href: "/donate"
  },
  {
    label: "Volunteer",
    href: "/volunteer"
  },
  {
    label: "Events",
    href: "/events"
  },
  {
    label: "Gallery",
    href: "/gallery"
  },
  {
    label: "Contact",
    href: "/support"
  }
];

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 border-t border-gray-800 z-20 relative">
      <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row md:justify-between gap-12">
        <div className="md:w-1/3 flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-3 mb-2">
            <img
              src="/images/logo.png"
              alt="Flourishing Souls Foundation Logo"
              className="h-10 w-10 object-contain rounded-full bg-white p-1"
              loading="lazy"
            />
            <span className="font-semibold text-xl tracking-tight text-white">
              Flourishing Souls Foundation
            </span>
          </Link>
          <p className="text-sm max-w-md">
            Empowering communities, supporting vulnerable individuals, and inspiring hope through outreach, advocacy, health, and education.  
          </p>
          <div className="flex gap-4 mt-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                rel="noopener noreferrer"
                target="_blank"
                className="hover:text-primary-400 transition-colors"
                aria-label={s.name}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
        <nav className="md:w-1/3">
          <ul className="flex flex-wrap gap-x-8 gap-y-2 justify-start md:justify-center mt-2">
            {footerNav.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className="hover:text-primary-300 font-medium transition-colors duration-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:w-1/3 flex flex-col gap-2">
          <h3 className="font-semibold mb-2">Contact</h3>
          <p className="text-sm">101 Example St, Lagos, Nigeria</p>
          <a href="tel:+234123456789" className="text-sm hover:underline">
            +234 123 456 789
          </a>
          <a href="mailto:info@flourishingsouls.org" className="text-sm hover:underline">
            info@flourishingsouls.org
          </a>
          <div className="mt-4">
            <Link
              to="/donate"
              className="inline-block bg-primary-500 text-white text-sm py-2 px-4 rounded shadow hover:bg-primary-600 transition-colors font-semibold"
            >
              Donate Now
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-2">
          <span>
            &copy; {new Date().getFullYear()} Flourishing Souls Foundation. All rights reserved.
          </span>
          <span>
            Designed with <span className="text-red-500">♥</span> for impact.
            <span className="ml-3">
              <Link to="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              {" | "}
              <Link to="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;      