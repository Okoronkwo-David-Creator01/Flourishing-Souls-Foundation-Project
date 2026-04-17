import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

/**
 * MainContent component
 * A responsive container that wraps the main content area of the application.
 * Adjusts with sidebar, header, and supports optional padding, custom classNames and style.
 * Automatically applies proper padding and overflow scroll for inner content.
 *
 * Usage:
 *  <MainContent>
 *    {children}
 *  </MainContent>
 *
 * Props:
 *  children     - The main page content displays here.
 *  className    - Additional classNames for outer container.
 *  style        - Additional inline styles for outer container.
 *  as           - HTML tag or React component to use (defaults to 'main').
 *  padding      - Boolean or string. If true, uses default padding. String can override e.g. 'px-8 py-4'.
 *  scrollable   - If true, sets overflow-y-auto on the content area.
 *  maxWidth     - Max width constraint (e.g. '7xl', 'full', '3xl').
 *  rest         - ...other props spread to the container.
 */

const DEFAULT_PADDING = "px-4 py-6 sm:px-8";

function getPaddingClass(padding) {
  if (typeof padding === "boolean" && padding) return DEFAULT_PADDING;
  if (typeof padding === "string") return padding;
  return "";
}

const MainContent = React.forwardRef(
  (
    {
      children,
      className = "",
      style = {},
      as = "main",
      padding = true,
      scrollable = true,
      maxWidth = "7xl",
      ...rest
    },
    ref
  ) => {
    const Component = as;
    // Compute maxWidthTailwind
    const maxWidthTailwind =
      maxWidth === "full"
        ? "max-w-full"
        : maxWidth
        ? `max-w-${maxWidth}`
        : "";

    // Compute padding class
    const paddingClass = getPaddingClass(padding);

    // Compose final className
    const outerClass = classNames(
      // Layout for flex row with sidebar/header
      "flex-1", // Fill available space vertically in layout
      "w-full",
      "transition-colors duration-300",
      maxWidthTailwind,
      paddingClass,
      className
    );

    const innerClass = classNames(
      scrollable ? "overflow-y-auto" : "",
      "min-h-[60vh] h-full"
    );

    return (
      <Component
        ref={ref}
        className={outerClass}
        style={style}
        tabIndex={-1}
        {...rest}
        data-testid="main-content"
        aria-label="Main content area"
      >
        <div className={innerClass}>{children}</div>
      </Component>
    );
  }
);

MainContent.displayName = "MainContent";

MainContent.propTypes = {
  /** The content to render inside MainContent */
  children: PropTypes.node.isRequired,
  /** Additional className to apply */
  className: PropTypes.string,
  /** Optional inline styles */
  style: PropTypes.object,
  /** Which HTML tag or React component to use (default: main) */
  as: PropTypes.elementType,
  /** If true, applies default padding; string overrides e.g. 'p-4' */
  padding: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  /** If true, inner content is scrollable (overflow-y-auto) */
  scrollable: PropTypes.bool,
  /** Tailwind max-width suffix (e.g. '7xl', 'full', '3xl') */
  maxWidth: PropTypes.string,
};

MainContent.defaultProps = {
  className: "",
  style: {},
  as: "main",
  padding: true,
  scrollable: true,
  maxWidth: "7xl",
};

export default MainContent;