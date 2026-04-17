import React from "react";
import { useGallery } from "../hooks/useGallery";
import GalleryGrid from "../components/gallery/GalleryGrid";

/**
 * Complex, production-ready Gallery page for real, live gallery data.
 * Assumes that useGallery hook implements real data fetching (e.g. from Supabase)
 * and exposes robust loading, error, refresh, filter, pagination, and upload mechanisms.
 * This component does not mock/simulate, operates entirely on actual user data.
 */

const Gallery = () => {
  // useGallery should provide: items, isLoading, error, refresh, filters, pagination, upload, delete, etc.
  const {
    items,
    isLoading,
    isUploading,
    isDeleting,
    error,
    refresh,
    addMedia,
    deleteMedia,
    filters,
    setFilters,
    search,
    setSearch,
    page,
    pageSize,
    totalPages,
    nextPage,
    prevPage,
    setPage,
    uploadingProgress,
  } = useGallery();

  // Upload handling
  const handleUpload = async (event) => {
    const files = event.target.files;
    if (!files || !files.length) return;
    await addMedia(files);
  };

  // Search & filter UI
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Render helpers
  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      {/* Example: filter by media type */}
      <select
        name="type"
        value={filters.type || ""}
        onChange={handleFilterChange}
        className="border px-2 py-1 rounded"
      >
        <option value="">All Types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
      </select>
      {/* Example: more filters */}
      {/* Add more select/inputs as required */}
      <input
        type="text"
        className="border px-2 py-1 rounded"
        placeholder="Search gallery…"
        value={search || ""}
        onChange={handleSearchChange}
      />
      <button
        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        onClick={refresh}
        disabled={isLoading}
        title="Refresh gallery data"
      >
        Refresh
      </button>
    </div>
  );

  const renderUpload = () => (
    <div className="flex flex-row gap-2 items-center mb-4">
      <label className="cursor-pointer flex items-center gap-2">
        <span className="font-medium">Add Media</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
        <span className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">
          Upload
        </span>
      </label>
      {isUploading && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          Uploading…
          {uploadingProgress !== undefined && (
            <span>({uploadingProgress}%)</span>
          )}
        </div>
      )}
    </div>
  );

  const renderPagination = () =>
    totalPages > 1 && (
      <div className="flex justify-center mt-4 gap-2">
        <button
          className="px-3 py-1 rounded border text-gray-800 hover:bg-gray-100"
          onClick={prevPage}
          disabled={page === 1 || isLoading}
        >
          Prev
        </button>
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPage(idx + 1)}
            className={`px-3 py-1 rounded border ${
              idx + 1 === page
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-gray-100"
            }`}
            disabled={isLoading}
          >
            {idx + 1}
          </button>
        ))}
        <button
          className="px-3 py-1 rounded border text-gray-800 hover:bg-gray-100"
          onClick={nextPage}
          disabled={page === totalPages || isLoading}
        >
          Next
        </button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6">Gallery</h1>
      {renderFilters()}
      {renderUpload()}
      {error && (
        <div className="text-red-600 mb-4 p-2 border border-red-400 bg-red-100 rounded">
          {error.message || "An error occurred while fetching the gallery."}
        </div>
      )}
      {isLoading ? (
        <div className="flex justify-center items-center py-10 text-xl text-gray-600">
          Loading gallery…
        </div>
      ) : (
        <GalleryGrid
          items={items}
          onDelete={deleteMedia}
          isDeleting={isDeleting}
        />
      )}
      {renderPagination()}
    </div>
  );
};

export default Gallery;

