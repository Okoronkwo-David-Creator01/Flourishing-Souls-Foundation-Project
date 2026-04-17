import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Notification } from "../common/ThemeProvider";
import GalleryItem from "./GalleryItem";
import PhotoViewer from "./PhotoViewer";
import VideoPlayer from "./VideoPlayer";

// Complex, production-ready GalleryGrid with real-time updates, uploads, preview, filtering and deletion support.
// Assumes "gallery" table in Supabase, with columns: id, type ('photo'|'video'), url, caption, created_at, uploaded_by, and (optionally) metadata

const PAGE_SIZE = 24;

const GalleryGrid = ({ canUpload = false, canDelete = false, user }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [preview, setPreview] = useState({ open: false, item: null });
  const [deleting, setDeleting] = useState(false);
  const pageRef = useRef(1); // Current page

  // Real-time subscription reference
  const realtimeSubscription = useRef(null);

  // Fetch paginated media items from Supabase
  const fetchGalleryMedia = useCallback(
    async ({ reset = false } = {}) => {
      setLoading(true);
      setFetchError("");
      try {
        const fromIdx = reset ? 0 : (pageRef.current - 1) * PAGE_SIZE;
        const toIdx = fromIdx + PAGE_SIZE - 1;
        let query = supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false })
          .range(fromIdx, toIdx);

        if (typeFilter !== "all") {
          query = query.eq("type", typeFilter);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        if (!data) throw new Error("Failed to load gallery items");

        let newMedia = reset ? data : [...media, ...data];
        setMedia(newMedia);

        // If returned less than PAGE_SIZE, no more to load
        setHasMore(data.length === PAGE_SIZE);

        // Only increment page if not reset
        if (!reset) pageRef.current += 1;
        else pageRef.current = 2;
      } catch (err) {
        setFetchError(
          err.message || "Failed to fetch gallery media. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, media]
  );

  // Initial + subsequent fetch
  useEffect(() => {
    fetchGalleryMedia({ reset: true });
    // eslint-disable-next-line
  }, [typeFilter]);

  // Real-time subscriptions (insert/delete/update)
  useEffect(() => {
    // Remove previous subscription if exists
    if (realtimeSubscription.current) {
      supabase.removeChannel(realtimeSubscription.current);
      realtimeSubscription.current = null;
    }

    const channel = supabase
      .channel("realtime:gallery")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMedia((old) => [payload.new, ...old]);
          } else if (payload.eventType === "DELETE") {
            setMedia((old) => old.filter((m) => m.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setMedia((old) =>
              old.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          }
        }
      )
      .subscribe();

    realtimeSubscription.current = channel;

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
        realtimeSubscription.current = null;
      }
    };
  }, []);

  // Infinite scroll (optional enhancement - can also use a "Load more" button)
  const gridRef = useRef();
  useEffect(() => {
    if (!hasMore || loading) return;

    const handleScroll = () => {
      if (!gridRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 420) {
        fetchGalleryMedia();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line
  }, [hasMore, loading, typeFilter, media]);

  // Upload handler (image or video)
  const uploadInputRef = useRef();

  async function handleUpload(e) {
    e.preventDefault();
    setUploading(true);
    setUploadError("");
    setSuccessMsg("");
    try {
      const form = e.target;
      const file = form.file.files[0];
      const caption = form.caption.value;
      if (!file) throw new Error("Please select a file to upload.");

      const ext = file.name.split(".").pop().toLowerCase();
      const isVideo = ["mp4", "mov", "webm"].includes(ext);
      const type = isVideo ? "video" : "photo";
      const bucket = isVideo ? "videos" : "images";
      const filePath = `${bucket}/${user.id}/${Date.now()}_${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error("Failed to get public file URL.");

      // Insert into gallery DB
      const { error: dbError } = await supabase.from("gallery").insert([
        {
          type,
          url: urlData.publicUrl,
          caption,
          uploaded_by: user.id,
          metadata: {
            name: file.name,
            size: file.size,
            mimetype: file.type,
          },
        },
      ]);

      if (dbError) throw dbError;

      setSuccessMsg(`${type === "photo" ? "Photo" : "Video"} uploaded!`);
      form.reset();
      setUploadModalOpen(false);
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // Delete handler
  async function handleDelete() {
    if (!selectedForDelete) return;
    setDeleting(true);
    try {
      // Remove from DB
      const { error: dbError } = await supabase
        .from("gallery")
        .delete()
        .eq("id", selectedForDelete.id);

      if (dbError) throw dbError;

      // Remove from storage
      let storageBucket, filePath;
      if (selectedForDelete.type === "photo") {
        storageBucket = "images";
        filePath = selectedForDelete.url.split("/").slice(-2).join("/");
      } else if (selectedForDelete.type === "video") {
        storageBucket = "videos";
        filePath = selectedForDelete.url.split("/").slice(-2).join("/");
      }
      if (storageBucket && filePath) {
        await supabase.storage.from(storageBucket).remove([filePath]);
      }

      setSuccessMsg("Deleted successfully.");
      setDeleteModalOpen(false);
      setSelectedForDelete(null);
    } catch (err) {
      setFetchError(err.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  // Filter
  function handleFilterChange(e) {
    setTypeFilter(e.target.value);
    setMedia([]);
    pageRef.current = 1;
  }

  // Preview open/close
  function openPreview(item) {
    setPreview({ open: true, item });
  }
  function closePreview() {
    setPreview({ open: false, item: null });
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <select
            value={typeFilter}
            onChange={handleFilterChange}
            className="border rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="all">All</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
          </select>
        </div>
        <div className="flex gap-2">
          {canUpload && (
            <Button variant="primary" onClick={() => setUploadModalOpen(true)}>
              Upload {typeFilter === "all" ? "Media" : typeFilter === "photo" ? "Photo" : "Video"}
            </Button>
          )}
        </div>
      </div>
      {fetchError && (
        <Notification type="error" className="mb-3">
          {fetchError}
        </Notification>
      )}
      {successMsg && (
        <Notification type="success" onClose={() => setSuccessMsg("")} className="mb-3">
          {successMsg}
        </Notification>
      )}
      <div
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10"
        data-testid="gallery-grid"
      >
        {loading && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-6">
            Loading gallery...
          </div>
        )}
        {!loading && media.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
            No media found.
          </div>
        )}
        {media.map((item) => (
          <GalleryItem
            key={item.id}
            item={item}
            onPreview={() => openPreview(item)}
            canDelete={
              canDelete ||
              (user && item.uploaded_by === user.id)
            }
            onDelete={() => {
              setSelectedForDelete(item);
              setDeleteModalOpen(true);
            }}
          />
        ))}
      </div>
      {hasMore && !loading && (
        <div className="flex justify-center mb-8">
          <Button variant="outline" onClick={() => fetchGalleryMedia()}>
            Load More
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)}>
        <form
          className="p-6 max-w-md mx-auto"
          onSubmit={handleUpload}
          encType="multipart/form-data"
        >
          <h3 className="text-lg font-semibold mb-3">Upload Media</h3>
          {uploadError && (
            <Notification
              type="error"
              className="mb-2"
              onClose={() => setUploadError("")}
            >
              {uploadError}
            </Notification>
          )}
          <div className="mb-3">
            <input
              ref={uploadInputRef}
              name="file"
              type="file"
              accept="image/*,video/*"
              className="w-full border rounded px-2 py-2"
              required
              disabled={uploading}
            />
            <div className="text-xs text-gray-500 mt-1">
              Supported: Images (JPG, PNG, GIF), Videos (MP4, MOV, WebM).
            </div>
          </div>
          <div className="mb-4">
            <input
              name="caption"
              className="w-full border rounded px-2 py-2"
              placeholder="Caption (optional)"
              maxLength={140}
              disabled={uploading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUploadModalOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={uploading}
              disabled={uploading}
            >
              Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6 text-center">
          <h4 className="text-xl font-semibold mb-4">
            Delete this {selectedForDelete?.type === "video" ? "Video" : "Photo"}?
          </h4>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-bold">
              {selectedForDelete?.caption ??
                (selectedForDelete?.type === "photo" ? "this photo" : "this video")}
            </span>
            ? This cannot be undone.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="ghost"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={preview.open} onClose={closePreview} width="xl">
        {preview.open && preview.item ? (
          preview.item.type === "video" ? (
            <VideoPlayer
              src={preview.item.url}
              caption={preview.item.caption}
              autoPlay
              controls
            />
          ) : (
            <PhotoViewer
              src={preview.item.url}
              alt={preview.item.caption || ""}
              caption={preview.item.caption}
            />
          )
        ) : null}
      </Modal>
    </div>
  );
};

export default GalleryGrid;