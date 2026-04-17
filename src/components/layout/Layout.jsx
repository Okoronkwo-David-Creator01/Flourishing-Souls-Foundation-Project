import React from "react";
import PropTypes from "prop-types";
import ThemeProvider from "../common/ThemeProvider";
import NotificationProvider from "../common/NotificationProvider";

/**
 * Layout: Main site/page wrapper for Flourishing Souls Foundation.
 *
 * - Provides consistent application shell for all non-admin/public flows.
 * - Supplies ThemeProvider and NotificationProvider at layout scope (global toasts/alerts, dark mode, etc).
 * - Allows pluggable header/footer/content; encourages composition with <Header />, <Footer /> etc.
 * - Handles safe accessibility root and minimum page height for sticky footers.
 *
 * Example:
 *   import Header from "./Header";
 *   import Footer from "./Footer";
 *   <Layout header={<Header />} footer={<Footer />}>...</Layout>
 *
 * Recommendations:
 * - Use for every main public/user-facing page.
 * - For admin views, see AdminLayout.
 */
const Layout = ({
  children,
  header,
  footer,
  className = "",
  containerProps = {},
  mainProps = {},
}) => {
  // Could extend later: e.g., add modal portal, global banners, page meta, etc.
  return (
    <ThemeProvider>
      <NotificationProvider>
        <div
          className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}
          {...containerProps}
        >
          {header && (
            <header
              className="w-full z-20 bg-white/70 dark:bg-gray-900/80 shadow-sm sticky top-0 backdrop-blur"
              role="banner"
            >
              {header}
            </header>
          )}
          {/* Main is always present */}
          <main
            className="flex-1 flex flex-col w-full max-w-full focus:outline-none"
            tabIndex={-1}
            role="main"
            {...mainProps}
          >
            {children}
          </main>
          {footer && (
            <footer
              className="w-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 mt-auto py-4 px-4"
              role="contentinfo"
            >
              {footer}
            </footer>
          )}
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
};

Layout.propTypes = {
  /** Content to render in the main area */
  children: PropTypes.node.isRequired,
  /** Optional header: e.g., site nav */
  header: PropTypes.node,
  /** Optional footer */
  footer: PropTypes.node,
  /** Optional extra classes for root div */
  className: PropTypes.string,
  /** Optional extra props for root container */
  containerProps: PropTypes.object,
  /** Optional extra props for <main> */
  mainProps: PropTypes.object,
};

export default Layout;
