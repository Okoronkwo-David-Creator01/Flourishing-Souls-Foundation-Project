import React, { useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaUser, FaSyncAlt } from "react-icons/fa";
import { Modal, Button, Spinner } from "../common/ThemeProvider";
import { notifySuccess, notifyError } from "../common/ThemeProvider";
import {
  createRole,
  updateRole,
  deleteRole,
  assignRole as assignUserRole,
  getRoles,
  getAllUsers,
} from "../../services/authService";

/**
 * RoleManager: Manages role CRUD and user-role assignment.
 * @param {Array} roles - List of role objects (id, name, description)
 * @param {Array} users - List of user objects (id, name, email, roleId etc)
 * @param {Function} onAssignRole - Callback after assigning user role
 */
const RoleManager = ({
  roles = [],
  users = [],
  onAssignRole = async () => {},
}) => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const [userRoleEditing, setUserRoleEditing] = useState(null);
  const [userRoleSubmitting, setUserRoleSubmitting] = useState(false);
  const [userRoleAssignments, setUserRoleAssignments] = useState({}); // {userId: selectedRoleId}

  const [loading, setLoading] = useState(false);

  // ────────────────────────────────────────────────────────────────
  // Role CRUD
  // ────────────────────────────────────────────────────────────────

  const openCreateRole = () => {
    setEditRole(null);
    setRoleForm({ name: "", description: "" });
    setShowRoleModal(true);
  };

  const openEditRole = (role) => {
    setEditRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
    });
    setShowRoleModal(true);
  };

  const handleRoleFormChange = (e) => {
    const { name, value } = e.target;
    setRoleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setRoleSubmitting(true);
    try {
      if (editRole) {
        await updateRole(editRole.id, roleForm);
        notifySuccess("Role updated.");
      } else {
        await createRole(roleForm);
        notifySuccess("Role created.");
      }
      setShowRoleModal(false);
      setRoleForm({ name: "", description: "" });
      // Optionally: refetch roles
    } catch {
      notifyError("Failed to save role.");
    }
    setRoleSubmitting(false);
  };

  const openDeleteRole = (role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setLoading(true);
    try {
      await deleteRole(roleToDelete.id);
      notifySuccess("Role deleted.");
      setShowDeleteModal(false);
      setRoleToDelete(null);
    } catch {
      notifyError("Failed to delete role.");
    }
    setLoading(false);
  };

  // ────────────────────────────────────────────────────────────────
  // User-Role Management
  // ────────────────────────────────────────────────────────────────

  const handleUserRoleEdit = (user) => {
    setUserRoleEditing(user.id);
    setUserRoleAssignments({
      ...userRoleAssignments,
      [user.id]: user.roleId || "",
    });
  };

  const handleUserRoleChange = (userId, roleId) => {
    setUserRoleAssignments((prev) => ({
      ...prev,
      [userId]: roleId,
    }));
  };

  const submitUserRole = async (user) => {
    setUserRoleSubmitting(true);
    try {
      await onAssignRole({
        userId: user.id,
        roleId: userRoleAssignments[user.id],
      });
      notifySuccess(`Role assigned to ${user.name}.`);
      setUserRoleEditing(null);
      setUserRoleAssignments((prev) => {
        const p = { ...prev };
        delete p[user.id];
        return p;
      });
    } catch {
      notifyError("Failed to assign role.");
    }
    setUserRoleSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FaUser /> Role Management
        </h2>
        <Button variant="primary" onClick={openCreateRole}>
          <FaPlus className="mr-1" /> Create Role
        </Button>
      </div>

      {/* Roles Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-muted">
                  No roles defined yet.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="border-t">
                  <td className="p-2">{role.name}</td>
                  <td className="p-2">{role.description || <em className="text-gray-400">—</em>}</td>
                  <td className="p-2 text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditRole(role)}
                      title="Edit"
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteRole(role)}
                      disabled={roles.length <= 1}
                      title="Delete"
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role Create/Edit Modal */}
      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={editRole ? "Edit Role" : "Create New Role"}
      >
        <form className="space-y-4" onSubmit={handleRoleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input
              name="name"
              className="form-input w-full"
              value={roleForm.name}
              onChange={handleRoleFormChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              className="form-textarea w-full"
              value={roleForm.description}
              onChange={handleRoleFormChange}
              rows={2}
              maxLength={128}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowRoleModal(false)}
              disabled={roleSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={roleSubmitting}
            >
              {editRole ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Role"
      >
        <div>
          <p>
            Are you sure you want to delete role{' '}
            <span className="font-bold">{roleToDelete?.name}</span>?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={loading}
              onClick={handleDeleteRole}
              disabled={roles.length <= 1}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign User Roles Table */}
      <div className="mt-10">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <FaUserShield /> User Role Assignment
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Current Role</th>
                <th className="p-2 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-muted">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-2">{user.name || user.email}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      {
                        roles.find((r) =>
                          r.id === (user.roleId || user.role_id)
                        )?.name || (
                          <span className="text-gray-400">None</span>
                        )
                      }
                    </td>
                    <td className="p-2 text-right w-48">
                      {userRoleEditing === user.id ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={e => {
                            e.preventDefault();
                            submitUserRole(user);
                          }}
                        >
                          <select
                            className="form-select"
                            value={userRoleAssignments[user.id] ?? (user.roleId || user.role_id || "")}
                            onChange={e =>
                              handleUserRoleChange(user.id, e.target.value)
                            }
                            required
                          >
                            {roles.map((r) => (
                              <option value={r.id} key={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            loading={userRoleSubmitting}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setUserRoleEditing(null)}
                            disabled={userRoleSubmitting}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserRoleEdit(user)}
                        >
                          <FaEdit className="mr-1" />
                          Change
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleManager;