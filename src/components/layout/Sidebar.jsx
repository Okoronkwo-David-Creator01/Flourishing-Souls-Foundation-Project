import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaDonate,
  FaHandsHelping,
  FaUserFriends,
  FaCalendarAlt,
  FaImages,
  FaSignInAlt,
  FaUserPlus,
  FaUserLock,
  FaSignOutAlt,
  FaCog,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import useAuth from "../../hooks/useAuth";

const navLinks = [
  { path: "/", label: "Home", icon: <FaHome /> },
  { path: "/donate", label: "Donate", icon: <FaDonate /> },
  { path: "/volunteer", label: "Volunteer", icon: <FaHandsHelping /> },
  { path: "/support", label: "Support", icon: <FaUserFriends /> },
  { path: "/events", label: "Events", icon: <FaCalendarAlt /> },
  { path: "/gallery", label: "Gallery", icon: <FaImages /> },
];

const authLinks = [
  { path: "/login", label: "Login", icon: <FaSignInAlt /> },
  { path: "/register", label: "Register", icon: <FaUserPlus /> },
];

const adminLinks = [
  { path: "/admin", label: "Admin", icon: <FaUserLock /> },
  { path: "/admin/settings", label: "Settings", icon: <FaCog /> },
];

const Sidebar = ({
  admin = false,
  mobileBreakpoint = "md", // for responsive, e.g. 'md' for md:hidden etc
  className = "",
}) => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Mobile sidebar open/close toggle
  const handleSidebarToggle = (e) => {
    if (e) e.preventDefault();
    setOpen((p) => !p);
  };

  // Render navigation links (general or admin)
  const renderLinks = (links) =>
    links.map((link) => (
      <li key={link.path}>
        <Link
          to={link.path}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
            location.pathname === link.path
              ? "bg-primary-200 text-primary-800 font-semibold"
              : "hover:bg-gray-200 text-gray-700"
          }`}
          onClick={() => setOpen(false)}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      </li>
    ));

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-30 transition-all duration-200 ${
          open ? "block" : "hidden"
        } ${mobileBreakpoint}:hidden`}
        onClick={handleSidebarToggle}
        aria-hidden={!open}
        data-testid="sidebarMobileOverlay"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-100
          shadow-lg flex flex-col z-40
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} 
          ${mobileBreakpoint}:translate-x-0 ${mobileBreakpoint}:static ${mobileBreakpoint}:h-auto
          ${className}
        `}
        aria-label="Main sidebar navigation"
        role="navigation"
      >
        {/* Close btn on mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src={logo} alt="Flourishing Souls Foundation Logo" className="w-10 h-10 rounded" />
            <span className="font-bold text-xl text-primary-800">Flourishing Souls</span>
          </Link>
          <button
            className={`block ${mobileBreakpoint}:hidden p-2 text-gray-600 hover:text-primary-600`}
            onClick={handleSidebarToggle}
            aria-label={open ? "Close sidebar" : "Open sidebar"}
            data-testid="sidebarMobileClose"
          >
            {open ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-4">
          <ul className="space-y-1 px-2">
            {!admin && renderLinks(navLinks)}

            {admin && (
              <>
                <h3 className="px-4 pt-2 pb-1 text-xs uppercase font-bold tracking-wide text-gray-400">
                  Admin Panel
                </h3>
                {renderLinks(adminLinks)}
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto px-4 py-3 border-t border-gray-100 space-y-2">
          {/* Auth section */}
          {!user && (
            <ul className="space-y-1">{renderLinks(authLinks)}</ul>
          )}

          {user && (
            <div className="flex items-center gap-2 group">
              <img
                src={user.avatar || "/images/logo.png"}
                alt={user.fullName || user.email}
                className="w-9 h-9 rounded-full object-cover border"
              />
              <div className="flex-1">
                <p className="text-sm font-medium leading-tight text-gray-700">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-gray-400">
                  {isAdmin ? "Administrator" : "Member"}
                </p>
              </div>
              <button
                className="ml-auto flex items-center px-2 py-1 rounded hover:bg-red-50 text-red-500 text-sm transition"
                onClick={logout}
                data-testid="sidebarLogout"
                title="Sign out"
              >
                <FaSignOutAlt className="mr-1" /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Hamburger button, visible only on mobile */}
      <button
        className={`
          fixed z-40 top-6 left-3 p-2 rounded-lg bg-primary-600 text-white shadow-lg
          transition hover:bg-primary-700 focus:outline-none
          ${open ? "hidden" : "block"}
          ${mobileBreakpoint}:hidden
        `}
        onClick={handleSidebarToggle}
        aria-label="Open sidebar"
        data-testid="sidebarMobileOpen"
      >
        <FaBars size={22} />
      </button>
    </>
  );
};

export default Sidebar;
