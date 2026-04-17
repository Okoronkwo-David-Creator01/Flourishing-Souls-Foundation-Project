import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

/**
 * Button component
 * Supports: 
 *  - variant: "primary", "secondary", "danger", "success", "outline", "link"
 *  - size: "sm", "md", "lg"
 *  - loading: shows loading indicator/spinner, disables button
 *  - fullWidth: stretches button to container width
 *  - leftIcon, rightIcon: for icon placement
 *  - disabled, onClick, type, aria-label for accessibility
 *  - Custom classes
 * 
 * Usage:
 * <Button variant="primary" size="lg" loading leftIcon={<Icon />} onClick={...}>Label</Button>
 */
const VARIANT_STYLES = {
  primary:
    "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 text-white border-transparent",
  secondary:
    "bg-gray-100 hover:bg-gray-200 focus-visible:ring-gray-400 text-gray-900 border-transparent",
  danger:
    "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white border-transparent",
  success:
    "bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 text-white border-transparent",
  outline:
    "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-blue-500",
  link: "bg-transparent text-blue-600 underline-offset-2 hover:underline p-0 border-0",
};

const SIZE_STYLES = {
  sm: "px-3 py-1.5 text-sm rounded",
  md: "px-4 py-2 text-base rounded-md",
  lg: "px-6 py-3 text-lg rounded-lg",
};

// Spinner component
const Spinner = ({ size, className }) => (
  <svg
    aria-hidden="true"
    className={classNames(
      "animate-spin mr-2 inline-block align-middle",
      {
        "w-4 h-4": size === "sm",
        "w-5 h-5": size === "md",
        "w-6 h-6": size === "lg",
      },
      className
    )}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    ></path>
  </svg>
);

Spinner.propTypes = {
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
};

const Button = React.forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className,
      onClick,
      "aria-label": ariaLabel,
      tabIndex,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const btnClass = classNames(
      "inline-flex items-center justify-center font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-150",
      VARIANT_STYLES[variant] || VARIANT_STYLES["primary"],
      SIZE_STYLES[size] || SIZE_STYLES["md"],
      {
        "opacity-60 pointer-events-none cursor-not-allowed": isDisabled,
        "w-full": fullWidth,
        "shadow": variant !== "link" && variant !== "outline",
      },
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={btnClass}
        onClick={onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
        {...rest}
      >
        {loading && (
          <Spinner size={size} />
        )}
        {leftIcon && !loading && (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        )}
        <span className={loading ? "opacity-70" : undefined}>
          {children}
        </span>
        {rightIcon && !loading && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

Button.propTypes = {
  /** Button text or element */
  children: PropTypes.node,
  /** Control HTML button type */
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  /** Style variant */
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "danger",
    "success",
    "outline",
    "link",
  ]),
  /** Size */
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  /** Full width or not */
  fullWidth: PropTypes.bool,
  /** Loading state (shows spinner, disables button) */
  loading: PropTypes.bool,
  /** Disable the button */
  disabled: PropTypes.bool,
  /** Left icon (React node) */
  leftIcon: PropTypes.node,
  /** Right icon (React node) */
  rightIcon: PropTypes.node,
  /** Custom className */
  className: PropTypes.string,
  /** Button click handler */
  onClick: PropTypes.func,
  /** Accessible aria label */
  "aria-label": PropTypes.string,
  tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

/**
 * Button export (named and default)
 */
export default Button;


