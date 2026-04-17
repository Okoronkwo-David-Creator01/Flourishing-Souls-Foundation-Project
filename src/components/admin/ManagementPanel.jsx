import React, { useState, useEffect } from "react";
import { FaUsers, FaUserShield, FaCogs, FaPlus, FaSyncAlt } from "react-icons/fa";
import UserList from "./UserList";
import RoleManager from "./RoleManager";
import Settings from "./Settings";
import { getAllUsers, refreshUserData, addUser, getRoles, assignRole } from "../../services/authService";
import { notifySuccess, notifyError } from "../common/ThemeProvider.jsx"; // Assumes Notification is exported here
import { Spinner, Modal, Button } from "../common/ThemeProvider.jsx"; // Assumes these are in common components
import AdminAuthGuard from "./AdminAuthGuard";

const ManagementPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users and roles on mount and when refreshed
  /**
   * Fetch users and roles from backend and update state.
   * @type {() => Promise<void>}
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([getAllUsers(), getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
      setLoading(false);
    } catch {
      setLoading(false);
      notifyError("Failed to load data. Please try again.");
    }
  };

  useEffect(() => {
    // Avoid calling setState synchronously in the effect body.
    // Schedule the fetch asynchronously to prevent cascading renders.
    // This is a safe/common workaround for data fetching on mount.
    const fetch = () => {
      fetchData();
    };
    // Use microtask queue to ensure effect completes before any state changes.
    Promise.resolve().then(fetch);
    // No cleanup necessary
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      await fetchData();
      setRefreshing(false);
      notifySuccess("Data refreshed successfully.");
    } catch {
      setRefreshing(false);
      notifyError("Failed to refresh data.");
    }
  };

  // Fixed: add missing closing brace for handleAddUser and bring handleAssignRole outside
  const handleAddUser = async userData => {
    try {
      const res = await addUser(userData);
      if (res) {
        await fetchData();
        setModalOpen(false);
        notifySuccess("User added successfully.");
      }
    } catch {
      notifyError("Failed to add user.");
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await assignRole(userId, roleId);
      await fetchData();
      notifySuccess("Role assigned successfully.");
    } catch (err) {
      notifyError(`Failed to assign role. ${err?.message || err}`);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="bg-white rounded-lg shadow p-6 min-h-[500px]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaCogs className="text-primary" />
            Management Panel
          </h2>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} disabled={refreshing} variant="ghost" title="Refresh Data">
              <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
            </Button>
            <Button onClick={() => setModalOpen(true)} variant="primary" title="Add User">
              <FaPlus className="mr-1" /> Add User
            </Button>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b mb-6">
          <button
            className={`px-3 py-2 font-semibold flex items-center gap-1 border-b-2 transition ${
              activeTab === "users" ? "text-primary border-primary" : "border-transparent text-gray-500 hover:text-primary"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <FaUsers /> Users
          </button>
          <button
            className={`px-3 py-2 font-semibold flex items-center gap-1 border-b-2 transition ${
              activeTab === "roles" ? "text-primary border-primary" : "border-transparent text-gray-500 hover:text-primary"
            }`}
            onClick={() => setActiveTab("roles")}
          >
            <FaUserShield /> Roles
          </button>
          <button
            className={`px-3 py-2 font-semibold flex items-center gap-1 border-b-2 transition ${
              activeTab === "settings" ? "text-primary border-primary" : "border-transparent text-gray-500 hover:text-primary"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <FaCogs /> Settings
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="min-h-[300px]">
            {activeTab === "users" && (
              <UserList users={users} onAssignRole={handleAssignRole} roles={roles} />
            )}
            {activeTab === "roles" && (
              <RoleManager roles={roles} users={users} onAssignRole={handleAssignRole} />
            )}
            {activeTab === "settings" && <Settings />}
          </div>
        )}

        {/* Modal for Adding User */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New User">
          <AddUserForm onSubmit={handleAddUser} onCancel={() => setModalOpen(false)} roles={roles} />
        </Modal>
      </div>
    </AdminAuthGuard>
  );
};

// -- AddUserForm Subcomponent --
const AddUserForm = ({ onSubmit, onCancel, roles }) => {
  const [values, setValues] = useState({ email: "", name: "", role: roles[0]?.id || "" });
  const [submitting, setSubmitting] = useState(false);

  // Only update the role if roles changes and the user hasn't modified the selection
  useEffect(() => {
    if (roles.length && !values.role) {
      setValues(val => ({ ...val, role: roles[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  const handleChange = e => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
      setSubmitting(false);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium block mb-1">Full Name</label>
        <input
          name="name"
          type="text"
          className="form-input w-full"
          value={values.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Email Address</label>
        <input
          name="email"
          type="email"
          className="form-input w-full"
          value={values.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Role</label>
        <select
          name="role"
          className="form-select w-full"
          value={values.role}
          onChange={handleChange}
          required
        >
          {roles.map(r => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Add User
        </Button>
      </div>
    </form>
  );
};

export default ManagementPanel;