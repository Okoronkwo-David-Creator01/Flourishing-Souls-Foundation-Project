import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaBars,
  FaUserCircle,
  FaChevronDown,
  FaSignOutAlt,
  FaUserLock,
  FaUserCog,
  FaSignInAlt,
  FaUserPlus,
} from "react-icons/fa";
const logo = "/images/logo.svg";
import useAuth from "../../hooks/useAuth";

/**
 * Complex, production-ready Header component.
 * Acts as the application's top navigation bar.
 * - Shows logo & links (responsive)
 * - Supports user menu (profile, admin, logout)
 * - Provides accessible mobile menu
 */

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Donate", path: "/donate" },
  { label: "Volunteer", path: "/volunteer" },
  { label: "Support", path: "/support" },
  { label: "Events", path: "/events" },
  { label: "Gallery", path: "/gallery" },
];

const adminLinks = [
  { label: "Admin Dashboard", path: "/admin", icon: <FaUserLock /> },
  { label: "Settings", path: "/admin/settings", icon: <FaUserCog /> },
];

const guestLinks = [
  { label: "Login", path: "/login", icon: <FaSignInAlt /> },
  { label: "Register", path: "/register", icon: <FaUserPlus /> },
];

function Header({ className = "", mobileBreakpoint = "md" }) {
  const { user, isAdmin, logout, loading } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavToggle = () => setNavOpen((prev) => !prev);

  const handleUserMenuToggle = () => setUserMenuOpen((prev) => !prev);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  // Close dropdown on navigation
  React.useEffect(() => {
    setNavOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Accessibility: close user menu on outside click or Escape
  React.useEffect(() => {
    if (!userMenuOpen) return;

    function handleClose(e) {
      if (e.key === "Escape") setUserMenuOpen(false);
      if (
        !e.target.closest(".header-user-dropdown") &&
        !e.target.closest(".header-user-trigger")
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleClose);
    document.addEventListener("mousedown", handleClose);
    return () => {
      document.removeEventListener("keydown", handleClose);
      document.removeEventListener("mousedown", handleClose);
    };
  }, [userMenuOpen]);

  return (
    <header
      className={`w-full bg-white shadow-sm border-b border-gray-100 z-50 relative ${className}`}
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center h-16">
        {/* Logo & brand */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="Flourishing Souls Foundation Home"
        >
          <img
            src={logo}
            alt="Flourishing Souls Foundation Logo"
            className="w-10 h-10 rounded"
          />
          <span className="font-bold text-xl text-primary-800 whitespace-nowrap">
            Flourishing Souls
          </span>
        </Link>
        {/* Hamburger for mobile */}
        <button
          className={`ml-3 ${mobileBreakpoint}:hidden inline-flex items-center p-2 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-400`}
          aria-label="Open navigation menu"
          aria-controls="header-nav"
          aria-expanded={navOpen}
          onClick={handleNavToggle}
          data-testid="headerMobileNavToggle"
        >
          <FaBars size={22} />
        </button>
        {/* Desktop nav */}
        <nav
          className={`hidden ${mobileBreakpoint}:flex items-center gap-2 flex-1 ml-6`}
          aria-label="Site navigation"
        >
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    location.pathname === link.path
                      ? "bg-primary-100 text-primary-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  tabIndex={0}
                  aria-current={location.pathname === link.path ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Spacer */}
        <div className="flex-1" />
        {/* User menu or login/register */}
        <div className="flex items-center gap-2">
          {!loading && !user && (
            <div className={`hidden ${mobileBreakpoint}:flex gap-2`}>
              {guestLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium text-sm gap-2 transition-colors"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}
          {user && (
            <div className="relative">
              {/* User menu button */}
              <button
                type="button"
                className="header-user-trigger flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                onClick={handleUserMenuToggle}
                data-testid="headerUserMenuBtn"
              >
                <img
                  src={user.avatar || "/images/logo.png"}
                  alt={user.fullName || user.email}
                  className="w-9 h-9 rounded-full object-cover border"
                  referrerPolicy="no-referrer"
                />
                <span className="hidden md:inline font-medium text-gray-800 text-sm max-w-[140px] truncate">
                  {user.fullName || user.email}
                </span>
                <FaChevronDown
                  className={`text-gray-400 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {/* User dropdown */}
              {userMenuOpen && (
                <div
                  className="header-user-dropdown absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-lg z-50 overflow-hidden animate-fadeIn"
                  role="menu"
                  tabIndex={-1}
                  data-testid="headerUserDropdown"
                >
                  <div className="px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || "/images/logo.png"}
                        alt={user.fullName || user.email}
                        className="w-10 h-10 rounded-full border object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-semibold text-gray-800 truncate">
                          {user.fullName || user.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {isAdmin ? "Administrator" : "Member"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ul className="py-1">
                    <li>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        tabIndex={0}
                        data-testid="headerProfileMenu"
                      >
                        <FaUserCircle /> Profile
                      </Link>
                    </li>
                    {isAdmin &&
                      adminLinks.map((link) => (
                        <li key={link.path}>
                          <Link
                            to={link.path}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {link.icon}
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                        role="menuitem"
                        tabIndex={0}
                        data-testid="headerLogoutBtn"
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Mobile nav menu */}
      <nav
        id="header-nav"
        className={`${
          navOpen
            ? "block animate-fadeIn"
            : "hidden"
        } ${mobileBreakpoint}:hidden bg-white border-t border-gray-100 shadow-lg absolute top-full left-0 right-0 z-40`}
        aria-label="Mobile navigation"
        data-testid="headerMobileNavMenu"
      >
        <ul className="flex flex-col gap-0 px-4 py-2">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`block px-3 py-3 rounded-lg font-medium text-base transition-colors ${
                  location.pathname === link.path
                    ? "bg-primary-100 text-primary-800"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
                aria-current={location.pathname === link.path ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {!loading && !user && (
            <>
              {guestLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 px-3 py-3 text-primary-600 hover:bg-primary-50 rounded-lg font-medium text-base transition-colors"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </>
          )}
          {user && (
            <>
              <li className="border-t border-gray-100 my-1" />
              <li>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-3 text-gray-800 hover:bg-primary-50 rounded-lg font-medium text-base transition-all"
                  data-testid="headerMobileProfile"
                >
                  <FaUserCircle /> Profile
                </Link>
              </li>
              {isAdmin &&
                adminLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="flex items-center gap-2 px-3 py-3 text-gray-800 hover:bg-primary-50 rounded-lg font-medium text-base transition-all"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </li>
                ))}
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-base transition"
                  data-testid="headerMobileLogout"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;