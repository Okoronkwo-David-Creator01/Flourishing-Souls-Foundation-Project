import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

/**
 * useGallery
 *
 * Provides a production-ready API for accessing, searching, uploading, deleting,
 * and listening to real-time updates for a gallery (photo & video) stored in Supabase.
 *
 * @returns {{
 *   items: GalleryItem[],
 *   loading: boolean,
 *   error: any,
 *   fetchGallery: (opts?: GalleryFetchOptions) => Promise<void>,
 *   searchGallery: (query: string) => Promise<void>,
 *   uploadFile: (file: File, type: "photo"|"video", metadata?: object) => Promise<{ success: boolean; data?: any; error?: any }>,
 *   deleteItem: (id: string) => Promise<{ success: boolean; error?: any }>,
 *   reload: () => Promise<void>
 * }}
 */

// GalleryItem Example:
// {
//   id: '...',
//   url: '...',
//   type: 'photo'|'video',
//   title: '...',
//   description: '...',
//   created_at: '...',
//   uploaded_by: '...',
//   // ...custom metadata
// }

const GALLERY_TABLE = "gallery"; // Ensure Supabase table is named 'gallery'
const GALLERY_BUCKET = "gallery-media"; // Ensure storage bucket is named appropriately

function useGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // to avoid duplicate subscription
  const subscriptionRef = useRef(null);

  // Fetch gallery items from Supabase table, sorted by most recent
  const fetchGallery = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from(GALLERY_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (opts?.type) {
        query = query.eq("type", opts.type);
      }
      if (opts?.limit) {
        query = query.limit(opts.limit);
      }
      if (opts?.uploaded_by) {
        query = query.eq("uploaded_by", opts.uploaded_by);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search gallery (title or description, simple LIKE)
  const searchGallery = useCallback(async (queryStr) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from(GALLERY_TABLE)
        .select("*")
        .or(
          `title.ilike.%${queryStr}%,description.ilike.%${queryStr}%`
        )
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload a photo or video to Supabase Storage and record in gallery table
  const uploadFile = useCallback(async (file, type, metadata = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (!file || !type || !["photo", "video"].includes(type))
        throw new Error("File and type (photo/video) required");

      // unique filename in bucket
      const ext = file.name.split(".").pop();
      const filePath =
        `${type}s/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(GALLERY_BUCKET)
        .upload(filePath, file, {
          cacheControl: "public, max-age=3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(GALLERY_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl)
        throw new Error("Could not retrieve public URL for upload");

      // Insert item in gallery table
      const insertObj = {
        url: publicUrl,
        type,
        title: metadata.title || file.name,
        description: metadata.description || "",
        uploaded_by: metadata.uploaded_by || null,
        created_at: new Date().toISOString(),
        ...metadata,
      };

      const { data: row, error: insertErr } = await supabase
        .from(GALLERY_TABLE)
        .insert([insertObj])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Add to local state at the top
      setItems((prev) => [row, ...prev]);
      setLoading(false);

      return { success: true, data: row };
    } catch (e) {
      setLoading(false);
      setError(e);
      return { success: false, error: e };
    }
  }, []);

  // Delete a gallery item (removes from table & storage)
  const deleteItem = useCallback(async (id) => {
    if (!id) return { success: false, error: "Missing gallery item id" };
    setLoading(true);
    setError(null);

    try {
      // Find the item
      const { data: itemData, error: findErr } = await supabase
        .from(GALLERY_TABLE)
        .select("*")
        .eq("id", id)
        .single();

      if (findErr || !itemData) throw findErr || new Error("Item not found");

      // Remove from storage
      const storageUrl = itemData.url;
      // Extract path after 'storage/v1/object/public/[bucket]/'
      const bucketUrlPrefix = `/storage/v1/object/public/${GALLERY_BUCKET}/`;
      let filePath = storageUrl.split(bucketUrlPrefix).pop();
      if (!filePath) {
        // fallback: may be full bucket path
        filePath = storageUrl.split(`${GALLERY_BUCKET}/`).pop();
      }
      if (!filePath) throw new Error("Could not parse storage path from URL");

      const { error: storageErr } = await supabase.storage
        .from(GALLERY_BUCKET)
        .remove([filePath]);
      if (storageErr) throw storageErr;

      // Remove from table
      const { error: delErr } = await supabase
        .from(GALLERY_TABLE)
        .delete()
        .eq("id", id);
      if (delErr) throw delErr;

      // Remove from local list
      setItems((prev) => prev.filter((item) => item.id !== id));
      setLoading(false);
      return { success: true };
    } catch (e) {
      setLoading(false);
      setError(e);
      return { success: false, error: e };
    }
  }, []);

  // Listen to real-time changes in the gallery table
  useEffect(() => {
    if (subscriptionRef.current) {
      // already subscribed
      return;
    }
    const channel = supabase
      .channel("realtime:gallery")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: GALLERY_TABLE },
        (payload) => {
          setItems((prevItems) => {
            if (payload.eventType === "INSERT") {
              // Add to top if not exists
              if (prevItems.some((i) => i.id === payload.new.id)) return prevItems;
              return [payload.new, ...prevItems];
            }
            if (payload.eventType === "DELETE") {
              return prevItems.filter((item) => item.id !== payload.old.id);
            }
            if (payload.eventType === "UPDATE") {
              return prevItems.map((item) =>
                item.id === payload.new.id ? payload.new : item
              );
            }
            return prevItems;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          subscriptionRef.current = channel;
        }
      });

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  // Initial load and reload utility
  const reload = useCallback(async () => {
    await fetchGallery();
  }, [fetchGallery]);

  useEffect(() => {
    fetchGallery();
    // no deps, want to run only on mount
    // eslint-disable-next-line
  }, []);

  return {
    items,
    loading,
    error,
    fetchGallery,
    searchGallery,
    uploadFile,
    deleteItem,
    reload,
  };
}

export { useGallery };
export default useGallery;


