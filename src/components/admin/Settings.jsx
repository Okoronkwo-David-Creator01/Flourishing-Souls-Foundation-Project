import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Notification } from "../common/ThemeProvider";
import ThemeSwitcher from "../common/ThemeSwitcher";

// Utility for loading site settings
async function fetchSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

// Utility for updating settings
async function updateSettings(updates) {
  const { data, error } = await supabase
    .from("settings")
    .update(updates)
    .eq("id", updates.id)
    .single();
  if (error) throw error;
  return data;
}

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState({ loading: false, success: false, error: null });
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    org_name: "",
    contact_email: "",
    contact_phone: "",
    donation_goal: "",
    theme: "system",
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Removed setLoading(true) as calling setState synchronously in the effect is discouraged.
    fetchSettings()
      .then((data) => {
        if (mounted) {
          setSettings(data);
          setForm({
            org_name: data.org_name || "",
            contact_email: data.contact_email || "",
            contact_phone: data.contact_phone || "",
            donation_goal: data.donation_goal !== null ? data.donation_goal : "",
            theme: data.theme || "system",
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          setSaveState(s => ({ ...s, error: error.message }));
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      org_name: settings?.org_name || "",
      contact_email: settings?.contact_email || "",
      contact_phone: settings?.contact_phone || "",
      donation_goal: settings?.donation_goal !== null ? settings?.donation_goal : "",
      theme: settings?.theme || "system"
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleThemeChange = (theme) => {
    setForm(f => ({ ...f, theme }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveState({ loading: true, success: false, error: null });
    try {
      const updated = await updateSettings({ 
        ...form,
        id: settings.id,
        donation_goal: form.donation_goal === "" ? null : Number(form.donation_goal)
      });
      setSettings(updated);
      setEditMode(false);
      setSaveState({ loading: false, success: true, error: null });
      setTimeout(() => setSaveState(s => ({ ...s, success: false })), 2000);
    } catch (err) {
      setSaveState({ loading: false, success: false, error: err.message });
    }
  };

  const handleReset = () => setShowModal(true);

  // For "Restore Defaults" confirm
  const handleRestoreDefaults = async () => {
    setShowModal(false);
    setSaveState({ loading: true, success: false, error: null });
    try {
      // Define default values (example values, update per real system requirements)
      const defaults = {
        org_name: "Flourishing Souls Foundation",
        contact_email: "info@flourishingsouls.org",
        contact_phone: "",
        donation_goal: 1000000,
        theme: "system"
      };
      const updated = await updateSettings({ ...defaults, id: settings.id });
      setSettings(updated);
      setForm(defaults);
      setEditMode(false);
      setSaveState({ loading: false, success: true, error: null });
    } catch (err) {
      setSaveState({ loading: false, success: false, error: err.message });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300">
        <span className="animate-spin mr-2">&#9696;</span>Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-primary">Admin Settings</h2>
        {!editMode &&
          <Button size="sm" variant="ghost" onClick={handleEdit}>
            Edit
          </Button>
        }
      </div>

      {saveState.error && (
        <Notification type="error" className="mb-2">
          {saveState.error}
        </Notification>
      )}
      {saveState.success && (
        <Notification type="success" className="mb-2">
          Settings updated successfully.
        </Notification>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="font-medium block mb-1">Organization Name</label>
          <input
            type="text"
            name="org_name"
            value={form.org_name}
            disabled={!editMode}
            onChange={handleChange}
            className="form-input w-full"
            required
            maxLength={80}
          />
        </div>
        <div>
          <label className="font-medium block mb-1">Donation Goal (₦)</label>
          <input
            type="number"
            name="donation_goal"
            min="0"
            step="1"
            value={form.donation_goal}
            disabled={!editMode}
            onChange={handleChange}
            className="form-input w-full"
            placeholder="Set the target fundraising goal"
          />
        </div>
        <div>
          <label className="font-medium block mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            value={form.contact_email}
            disabled={!editMode}
            onChange={handleChange}
            className="form-input w-full"
            required
            maxLength={120}
          />
        </div>
        <div>
          <label className="font-medium block mb-1">Contact Phone</label>
          <input
            type="tel"
            name="contact_phone"
            value={form.contact_phone}
            disabled={!editMode}
            onChange={handleChange}
            className="form-input w-full"
            placeholder="e.g. +2341234567890"
            maxLength={22}
          />
        </div>
        <div>
          <label className="font-medium block mb-1">Site Theme</label>
          <ThemeSwitcher
            value={form.theme}
            disabled={!editMode}
            onChange={handleThemeChange}
          />
        </div>
        {/* Action buttons */}
        {editMode && (
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={saveState.loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saveState.loading}
              disabled={saveState.loading}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>

      <hr className="my-6 border-gray-200 dark:border-gray-700" />

      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">Danger Zone</span>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleReset}
        >
          Restore Defaults
        </Button>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Restore default settings?"
      >
        <div className="mb-5">
          <p>
            Are you sure you want to restore all settings to their default values?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={saveState.loading}
            onClick={handleRestoreDefaults}
          >
            Yes, Restore
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;