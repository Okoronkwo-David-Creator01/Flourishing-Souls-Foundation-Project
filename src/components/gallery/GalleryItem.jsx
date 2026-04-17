import React, { useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../hooks/useAuth";
import { useGallery } from "../../hooks/useGallery";
import { Button } from "../common/ThemeProvider";
import Modal from "../common/Modal";
import VideoPlayer from "./VideoPlayer";
import PhotoViewer from "./PhotoViewer";

// GalleryItem: Displays a single photo or video with full production-ready features
const GalleryItem = ({ item, onDeleted, onUpdated }) => {
  const { user, isAdmin } = useAuth();
  const { deleteGalleryItem, updateGalleryItem } = useGallery();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState(item.caption || "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Handler to show/hide preview modal
  const handlePreview = () => setPreviewOpen(true);
  const closePreview = () => setPreviewOpen(false);

  // Handler to trigger delete modal
  const handleDeleteClick = () => {
    setDeleteError("");
    setShowDeleteModal(true);
  };

  // Handler for deletion
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteGalleryItem(item.id);
      setDeleteLoading(false);
      setShowDeleteModal(false);
      if (onDeleted) onDeleted(item.id);
    } catch (err) {
      setDeleteLoading(false);
      setDeleteError(err.message || "Failed to delete. Try again.");
    }
  };

  // Handler to open edit modal
  const handleEditClick = () => {
    setEditCaption(item.caption || "");
    setEditError("");
    setShowEditModal(true);
  };

  // Handler to submit edit
  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const updated = await updateGalleryItem(item.id, { caption: editCaption });
      setEditLoading(false);
      setShowEditModal(false);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      setEditLoading(false);
      setEditError(err.message || "Failed to update. Try again.");
    }
  };

  // Admin or uploader can manage items
  const canManage =
    isAdmin ||
    (user && item.uploader_id && user.id && user.id === item.uploader_id);

  return (
    <div className="gallery-item relative group rounded overflow-hidden shadow bg-white dark:bg-gray-900">
      <div
        className={`aspect-w-1 aspect-h-1 cursor-pointer transition-transform duration-150 hover:scale-[1.03]`}
        onClick={handlePreview}
        tabIndex={0}
        role="button"
        aria-label={
          item.type === "photo"
            ? item.caption || "View photo"
            : item.caption || "Play video"
        }
        onKeyPress={e => {
          if (e.key === "Enter" || e.key === " ") handlePreview();
        }}
      >
        {item.type === "video" ? (
          <div className="relative h-full w-full bg-black flex items-center justify-center">
            <VideoPlayer
              src={item.url}
              caption={item.caption}
              thumbnail={item.thumbnail_url}
              controls={false}
              showPlayButton
              className="object-cover max-h-48"
              aria-hidden
            />
            <span className="absolute bottom-2 right-2 bg-black/70 text-white rounded px-2 py-1 text-xs">
              Video
            </span>
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.caption || "Gallery photo"}
            className="object-cover w-full h-full transition-opacity duration-200 group-hover:opacity-90"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 pt-3 pb-2 min-h-[56px]">
        {item.caption && (
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-words">
            {item.caption}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          {item.uploader_name && (
            <span className="text-xs text-gray-500 dark:text-gray-300 truncate" title={item.uploader_name}>
              Uploaded by{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-200">
                {item.uploader_name}
              </span>
            </span>
          )}
          {item.created_at && (
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(item.created_at).toLocaleDateString([], {
                year: "numeric",
                month: "short",
                day: "numeric"
              })}
            </span>
          )}
        </div>
        {canManage && (
          <div className="flex gap-2 mt-2">
            <Button
              size="xs"
              variant="ghost"
              onClick={handleEditClick}
              className="text-primary-600"
            >
              Edit
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={handleDeleteClick}
              className="ml-1"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={closePreview}
        width={item.type === "photo" ? "md" : "xl"}
      >
        {previewOpen &&
          (item.type === "photo" ? (
            <PhotoViewer
              src={item.url}
              alt={item.caption || ""}
              caption={item.caption}
            />
          ) : (
            <VideoPlayer
              src={item.url}
              caption={item.caption}
              autoPlay
              controls
            />
          ))}
      </Modal>

      {/* Edit Caption Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <form className="p-6" onSubmit={handleEdit}>
          <h4 className="text-lg font-semibold mb-3 text-center">
            Edit Caption
          </h4>
          <label className="block mb-2 text-sm font-medium" htmlFor={`edit-caption-${item.id}`}>
            Caption
          </label>
          <input
            id={`edit-caption-${item.id}`}
            type="text"
            value={editCaption}
            onChange={e => setEditCaption(e.target.value)}
            className="form-input w-full mb-3"
            maxLength={200}
            placeholder="Enter a new caption"
            disabled={editLoading}
            autoFocus
          />
          {editError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3">
              {editError}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowEditModal(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={editLoading}
              disabled={editLoading || editCaption === item.caption}
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6 text-center">
          <h4 className="text-xl font-semibold mb-4">Delete {item.type === "photo" ? "Photo" : "Video"}?</h4>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-bold">
              {item.caption || (item.type === "photo" ? "this photo" : "this video")}
            </span>
            ? This action cannot be undone.
          </p>
          {deleteError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3">
              {deleteError}
            </div>
          )}
          <div className="flex gap-2 justify-center mt-2">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteLoading}
              disabled={deleteLoading}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

GalleryItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    url: PropTypes.string.isRequired,
    caption: PropTypes.string,
    type: PropTypes.oneOf(["photo", "video"]).isRequired,
    uploader_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    uploader_name: PropTypes.string,
    created_at: PropTypes.string,
    thumbnail_url: PropTypes.string
  }).isRequired,
  onDeleted: PropTypes.func,
  onUpdated: PropTypes.func
};

export default GalleryItem;