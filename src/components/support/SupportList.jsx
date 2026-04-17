import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { getSupportRequests } from "../../services/supabaseService";
import Notification from "../common/Notification";

/**
 * Production-ready support requests listing component for admin and support members.
 * Fetches real requests from Supabase, supports pagination, searching, sorting, and real error handling.
 */
const PAGE_SIZE = 10;

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-600",
};

function SupportList({
  initialRequests,
  adminView = false,
  showSearch = true,
  showStatus = true,
  onRequestClick,
  className = "",
}) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchRequests = useCallback(
    async (options) => {
      setLoading(true);
      setNotification(null);
      try {
        const { data, error, count } = await getSupportRequests({
          page: options?.page ?? page,
          pageSize: PAGE_SIZE,
          search: options?.search ?? searchText,
          sortBy: options?.sortBy ?? sortBy,
          sortOrder: options?.sortOrder ?? sortOrder,
          admin: adminView,
        });
        if (error) throw new Error(error.message || "Failed to fetch requests");
        setRequests(data);
        setTotalCount(count);
      } catch (err) {
        setNotification({
          type: "error",
          message: err.message || "An error occurred while fetching support requests.",
        });
      } finally {
        setLoading(false);
      }
    },
    [adminView, page, searchText, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests({ search: searchText, page: 1 });
  };

  const handleSort = (field) => {
    let order = "asc";
    if (sortBy === field && sortOrder === "asc") order = "desc";
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
    fetchRequests({ sortBy: field, sortOrder: order, page: 1 });
  };

  const handlePageChange = (next) => {
    const nextPage = Math.max(1, Math.min(next, Math.ceil((totalCount || 0) / PAGE_SIZE)));
    setPage(nextPage);
    fetchRequests({ page: nextPage });
  };

  const handleSearchInputChange = (e) => {
    setSearchText(e.target.value);
    if (!e.target.value.trim()) {
      setPage(1);
      fetchRequests({ search: "", page: 1 });
    }
  };

  return (
    <div className={`support-list-container ${className}`}>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          className="mb-4"
        />
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Support Requests</h2>
        {showSearch && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              className="border rounded px-2 py-1 min-w-[200px]"
              placeholder="Search by name, email, or subject"
              value={searchText}
              onChange={handleSearchInputChange}
            />
            <button
              type="submit"
              className="rounded px-3 py-1 bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
            >
              Search
            </button>
          </form>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full bg-white dark:bg-gray-900 border border-gray-200 rounded shadow text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-200">
              <th className="p-2 cursor-pointer" onClick={() => handleSort("name")}>
                Name {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("email")}>
                Email {sortBy === "email" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort("subject")}>
                Subject {sortBy === "subject" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              {showStatus && (
                <th className="p-2 cursor-pointer" onClick={() => handleSort("status")}>
                  Status {sortBy === "status" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
              )}
              <th className="p-2 cursor-pointer" onClick={() => handleSort("created_at")}>
                Date {sortBy === "created_at" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
              {adminView && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={adminView ? 6 : 5} className="py-6 text-center text-gray-500">
                  No results found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={adminView ? 6 : 5} className="py-6 text-center">
                  <span className="animate-spin mr-2">🔄</span> Loading...
                </td>
              </tr>
            )}
            {!loading &&
              requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                  onClick={() => onRequestClick && onRequestClick(req)}
                >
                  <td className="p-2 font-medium">{req.name}</td>
                  <td className="p-2">{req.email}</td>
                  <td className="p-2">{req.subject}</td>
                  {showStatus && (
                    <td className="p-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          STATUS_COLOR[req.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {req.status?.charAt(0).toUpperCase() + req.status?.slice(1) || "Pending"}
                      </span>
                    </td>
                  )}
                  <td className="p-2">
                    {req.created_at
                      ? new Date(req.created_at).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </td>
                  {adminView && (
                    <td className="p-2 text-right">
                      {/* Example actions: can expand/modify as per real use case */}
                      <button
                        className="mr-2 px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                        title="View details"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRequestClick) onRequestClick(req);
                        }}
                      >
                        View
                      </button>
                      {
                        req.status !== "resolved" && (
                          <button
                            className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                            title="Mark as resolved"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setLoading(true);
                              setNotification(null);
                              try {
                                // NOTE: You should implement markSupportRequestResolved in supabaseService!
                                await import("../../services/supabaseService")
                                  .then(mod => mod.markSupportRequestResolved(req.id));
                                fetchRequests();
                                setNotification({
                                  type: "success",
                                  message: "Marked as resolved.",
                                });
                              } catch (err) {
                                setNotification({
                                  type: "error",
                                  message: err.message || "Could not mark as resolved.",
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            Resolve
                          </button>
                        )
                      }
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {totalCount > PAGE_SIZE && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-600">
            {`Page ${page} of ${Math.ceil((totalCount || 0) / PAGE_SIZE)}, `}
            {`Total: ${totalCount} requests`}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-100"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded border bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-100"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil((totalCount || 0) / PAGE_SIZE) || loading}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

SupportList.propTypes = {
  /** Optionally provide initial requests (e.g., for SSR/hydration) */
  initialRequests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string,
      subject: PropTypes.string,
      status: PropTypes.string,
      created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    })
  ),
  /** If true, shows admin actions (resolve, view, etc) */
  adminView: PropTypes.bool,
  /** Show search bar */
  showSearch: PropTypes.bool,
  /** Show request status as a column */
  showStatus: PropTypes.bool,
  /** Callback when a request row is clicked */
  onRequestClick: PropTypes.func,
  className: PropTypes.string,
};

export default SupportList;

