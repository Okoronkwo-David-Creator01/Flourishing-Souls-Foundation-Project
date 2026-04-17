import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Button, Modal, Spinner, Notification } from "../common/ThemeProvider";
import { FaEdit, FaTrash, FaSync, FaUserShield, FaEye, FaSearch } from "react-icons/fa";

/**
 * Production UserList component.
 * Fetches users real-time from Supabase, supports searching, deletion, and viewing user details.
 */
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [error, setError] = useState(null);
  const [notify, setNotify] = useState(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users (real-time with Supabase subscription)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("users")
        .select("id, email, name, created_at, role, avatar_url, is_active");
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      const { data, error: supaError } = await query.order("created_at", { ascending: false });
      if (supaError) throw supaError;
      setUsers(data || []);
    } catch (err) {
      setError(err.message || "Error loading users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  // Initial & real-time fetch
  useEffect(() => {
    fetchUsers();
    // Supabase real-time subscription (if available)
    const userChannel = supabase
      .channel("users-list-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        payload => {
          fetchUsers();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(userChannel);
    };
    // eslint-disable-next-line
  }, [fetchUsers]);

  // Search handler
  const handleSearch = e => {
    setSearch(e.target.value);
  };

  // Refresh users
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
  };

  // Handle delete
  const handleDelete = async userId => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setDeletingUserId(userId);
    setError(null);
    try {
      // If using Supabase Auth + User table
      // 1. Remove from users table (if soft-delete, just update is_active)
      // 2. Optionally, call Supabase Admin API to remove user from Auth
      
      // Soft delete in users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userId);
      if (updateError) throw updateError;
      setNotify({ type: "success", message: "User deleted (deactivated) successfully." });
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Could not delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  // Open modal with user details
  const handleViewUser = user => {
    setSelectedUser(user);
    setShowModal(true);
  };

  // Render user detail
  const renderUserDetail = () =>
    selectedUser && (
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="User Details">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <img
              src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || "User")}`}
              alt="avatar"
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <div className="text-lg font-bold">{selectedUser.name}</div>
              <div className="text-gray-600">{selectedUser.email}</div>
              <div className="text-xs text-gray-500">
                Joined: {new Date(selectedUser.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div>
              <span className="font-semibold">Role: </span>
              {selectedUser.role}
            </div>
            <div>
              <span className="font-semibold">Status: </span>
              {selectedUser.is_active ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-red-600">Deactivated</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-primary mb-2 md:mb-0">All Users</h2>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={handleSearch}
              className="form-input pl-8 pr-3 py-2 text-sm rounded-md"
            />
            <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshing || loading}>
            <FaSync className={`mr-1 inline ${refreshing && "animate-spin"}`} />
            Refresh
          </Button>
        </div>
      </div>
      {notify && (
        <Notification
          type={notify.type}
          onClose={() => setNotify(null)}
        >
          {notify.message}
        </Notification>
      )}
      {error && (
        <Notification type="error" onClose={() => setError(null)}>
          {error}
        </Notification>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avatar</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-2 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center">
                  <Spinner size="lg" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className={user.is_active ? "" : "bg-red-50 dark:bg-red-900"}>
                  <td className="px-2 py-3">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <span className="font-semibold">{user.name}</span>
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-sm">{user.email}</span>
                  </td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                      user.role === "admin"
                        ? "bg-blue-100 text-blue-700"
                        : user.role === "moderator"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                      {user.role === "admin" && <FaUserShield className="ml-1 text-blue-500" />}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    {user.is_active ? (
                      <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-xs">
                      {new Date(user.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 py-3 flex gap-2">
                    <Button
                      title="View"
                      size="xs"
                      variant="ghost"
                      onClick={() => handleViewUser(user)}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      title="Delete"
                      size="xs"
                      variant="danger"
                      onClick={() => handleDelete(user.id)}
                      loading={deletingUserId === user.id}
                      disabled={deletingUserId === user.id || !user.is_active}
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
      {renderUserDetail()}
    </div>
  );
};

export default UserList;
