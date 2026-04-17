import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  Fragment,
} from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

/**
 * useLockBodyScroll(lock: boolean)
 * Prevents scrolling of the background when modal is open.
 */
function useLockBodyScroll(lock) {
  useEffect(() => {
    if (!lock) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [lock]);
}

/**
 * useFocusTrap(isActive, ref)
 * Ensure tab/focus stays inside modal when open.
 */
function useFocusTrap(isActive, ref) {
  useEffect(() => {
    if (!isActive) return;
    const node = ref.current;
    if (!node) return;
    const getFocusableEls = () =>
      node.querySelectorAll(
        [
          "a[href]",
          "area[href]",
          "input:not([disabled]):not([type='hidden'])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "button:not([disabled])",
          "iframe",
          "object",
          "embed",
          "*[tabindex]:not([tabindex='-1'])",
          "*[contenteditable=true]",
        ].join(",")
      );
    function onKeyDown(e) {
      if (e.key !== "Tab") return;
      const els = Array.from(getFocusableEls());
      if (!els.length) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [isActive, ref]);
}

/**
 * Modal component - production-ready, accessible, composable, robust.
 */
const Modal = forwardRef(function Modal(
  {
    open,
    onClose,
    title,
    children,
    footer,
    actions,
    showClose = true,
    overlayClose = true,
    className = "",
    size = "md", // 'sm' | 'md' | 'lg' | 'xl' | 'full'
    initialFocusRef,
    ariaLabelledby,
    ariaDescribedby,
    id = undefined,
    preventCloseOnEsc = false,
    preventCloseOnOverlayClick = false,
    closeOnAction = true,
    bodyClassName = "",
    headerClassName = "",
    footerClassName = "",
    overlayClassName = "",
    containerClassName = "",
    ...rest
  },
  ref
) {
  const localRef = useRef();
  useImperativeHandle(ref, () => localRef.current);

  // Lock scroll when open
  useLockBodyScroll(open);

  // Trap focus when open
  useFocusTrap(open, localRef);

  // Focus management
  useEffect(() => {
    if (!open) return;
    const node = localRef.current;
    if (!node) return;
    if (initialFocusRef && initialFocusRef.current) {
      initialFocusRef.current.focus();
    } else {
      // focus first focusable element
      const el = node.querySelector(
        [
          "button:not([disabled])",
          "[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex='-1'])",
        ].join(",")
      );
      if (el) el.focus();
    }
  }, [open, initialFocusRef]);

  // Handle keydown: ESC to close modal
  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === "Escape" && !preventCloseOnEsc) {
        if (typeof onClose === "function") onClose();
      }
    },
    [onClose, open, preventCloseOnEsc]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const handleOverlayClick = (e) => {
    if (!overlayClose || preventCloseOnOverlayClick) return;
    if (e.target === e.currentTarget) {
      if (typeof onClose === "function") onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    full: "w-full max-w-none h-full",
  };

  if (!open) return null;

  return (
    <Fragment>
      <div
        aria-modal="true"
        role="dialog"
        aria-labelledby={ariaLabelledby || (title ? `modal-title-${id || ""}` : undefined)}
        aria-describedby={ariaDescribedby}
        id={id}
        className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center px-2 py-8",
          containerClassName
        )}
        tabIndex={-1}
        ref={localRef}
        {...rest}
      >
        {/* Overlay */}
        <div
          className={clsx(
            "fixed inset-0 bg-black bg-opacity-40 transition-opacity duration-200",
            overlayClassName
          )}
          style={{ zIndex: 49 }}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <div
          className={clsx(
            "relative z-50 bg-white rounded-lg shadow-xl flex flex-col w-full",
            sizeClasses[size] || sizeClasses.md,
            "max-h-[90vh]",
            className
          )}
        >
          {/* Header */}
          {(title || showClose) && (
            <div
              className={clsx(
                "flex items-center justify-between px-6 py-4 border-b border-gray-100",
                headerClassName
              )}
            >
              {title && (
                <h2
                  id={ariaLabelledby || `modal-title-${id || ""}`}
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
              {showClose && (
                <button
                  type="button"
                  className="ml-4 p-2 rounded hover:bg-gray-100 transition focus:outline-none"
                  onClick={onClose}
                  aria-label="Close modal"
                  tabIndex={0}
                  data-testid="modal-close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.415 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.415-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div
            className={clsx(
              "px-6 py-4 overflow-y-auto flex-1",
              bodyClassName
            )}
          >
            {children}
          </div>

          {/* Footer/actions */}
          {(footer || (actions && Array.isArray(actions) && actions.length > 0)) && (
            <div
              className={clsx(
                "flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50",
                footerClassName
              )}
            >
              {footer ? (
                footer
              ) : (
                actions &&
                actions.map((action, idx) => {
                  const {
                    label,
                    onClick,
                    type = "primary", // "primary", "secondary"
                    disabled = false,
                    autoFocus = false,
                    ...actionProps
                  } = action;
                  const btnClass = clsx(
                    "px-4 py-2 rounded font-medium transition",
                    type === "primary"
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      : "bg-white border text-gray-900 hover:bg-gray-100 focus:ring-gray-400"
                  );
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={btnClass}
                      onClick={() => {
                        if (onClick) onClick();
                        if (closeOnAction && onClose) onClose();
                      }}
                      disabled={disabled}
                      autoFocus={autoFocus}
                      {...actionProps}
                    >
                      {label}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
});

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      onClick: PropTypes.func,
      type: PropTypes.oneOf(["primary", "secondary"]),
      disabled: PropTypes.bool,
      autoFocus: PropTypes.bool,
    })
  ),
  showClose: PropTypes.bool,
  overlayClose: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "full"]),
  initialFocusRef: PropTypes.object,
  ariaLabelledby: PropTypes.string,
  ariaDescribedby: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  preventCloseOnEsc: PropTypes.bool,
  preventCloseOnOverlayClick: PropTypes.bool,
  closeOnAction: PropTypes.bool,
  bodyClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  overlayClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  footer: PropTypes.node,
};

export default Modal;