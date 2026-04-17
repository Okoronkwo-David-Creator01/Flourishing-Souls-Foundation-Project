import React from "react";
import PropTypes from "prop-types";

/**
 * PhotoViewer
 * A production-ready, accessibility-focused component for displaying a photo in a responsive, modal-like viewer.
 *
 * Props:
 *   - src (string, required): The photo URL to display.
 *   - alt (string, optional): Alt text for accessibility (should be present!).
 *   - caption (string, optional): The photo's caption/description.
 *   - onClick (function, optional): Called when the image is clicked (e.g., for closing modal or other actions).
 *   - style (object, optional): Inline style object for image.
 *   - className (string, optional): Additional CSS classes for the wrapper.
 *   - maxHeight (string|number, optional): Restricts image height (e.g., "80vh").
 *   - loading (string, optional): The loading attribute for <img> ("lazy" | "eager" | "auto").
 */

const PhotoViewer = ({
  src,
  alt = "",
  caption = "",
  onClick,
  style = {},
  className = "",
  maxHeight = "75vh",
  loading = "lazy",
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-transparent select-none ${className}`}
      style={{ minHeight: "280px" }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      onClick={onClick}
      data-testid="photo-viewer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative flex flex-col items-center overflow-hidden outline-0"
        data-testid="photo-viewer-image-container"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "96vw",
            maxHeight: maxHeight,
            width: "auto",
            height: "auto",
            borderRadius: "0.75rem",
            objectFit: "contain",
            boxShadow:
              "0 4px 32px 0 rgba(0,0,0,0.24), 0 1.5px 3px 0 rgba(30,41,59,0.18)",
            ...style,
          }}
          className="block bg-gray-200 dark:bg-gray-700"
          loading={loading}
          draggable={false}
          data-testid="photo-viewer-image"
        />
        {caption && (
          <div
            className="mt-4 px-2 py-1 text-center text-base text-gray-700 dark:text-gray-100 bg-slate-50/80 dark:bg-slate-900/80 rounded shadow max-w-[90vw] max-h-36 overflow-y-auto"
            data-testid="photo-viewer-caption"
            title={caption}
            aria-label="Photo caption"
          >
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

PhotoViewer.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  caption: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object,
  className: PropTypes.string,
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  loading: PropTypes.oneOf(["lazy", "eager", "auto"]),
};

export default PhotoViewer;