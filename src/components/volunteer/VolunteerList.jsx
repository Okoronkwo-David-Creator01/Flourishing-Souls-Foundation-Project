import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { getSupabaseClient } from "../../lib/supabase";

/**
 * Page size for volunteers per fetch
 */
const PAGE_SIZE = 15;

/**
 * Parse filter/search params for volunteer query
 */
function buildQuery(supabase, { search, filterStatus }) {
  let query = supabase.from("volunteers").select("*", { count: "exact" });
  if (search && search.trim().length > 0) {
    // Simple search: name or email or phone ilike
    query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
  }
  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }
  return query;
}

/**
 * Production volunteer list display with admin features and real data
 */
const VolunteerList = ({
  supabaseUrl,
  supabaseKey,
  adminView = false,
  initialVolunteers = [],
  showSearch = true,
  showStatus = true,
  className = "",
  onVolunteerClick,
  pageSize = PAGE_SIZE,
}) => {
  const [volunteers, setVolunteers] = useState(initialVolunteers || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState("");
  const [refreshFlag, setRefreshFlag] = useState(false);

  // For optimistic status update in adminView
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const supabase = useMemo(() => getSupabaseClient(supabaseUrl, supabaseKey), [supabaseUrl, supabaseKey]);

  // Fetch volunteers function, paginated & filtered
  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let fromIndex = (page - 1) * pageSize;
      let toIndex = fromIndex + pageSize - 1;

      let query = buildQuery(supabase, { search, filterStatus });
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(fromIndex, toIndex);

      if (error) throw error;
      setVolunteers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err.message || "Failed to load volunteers.");
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [supabase, page, pageSize, search, filterStatus, refreshFlag]);

  // Initial and dependency-based fetch
  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  // Utility for status filtering options
  const volunteerStatuses = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Rejected", value: "rejected" },
  ];

  // Optimistic update handler (adminView only)
  const handleStatusChange = async (id, newStatus) => {
    if (!adminView) return;
    setUpdatingStatusId(id);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("volunteers")
        .update({ status: newStatus })
        .eq("id", id);
      if (updateError) throw updateError;
      setRefreshFlag(f => !f); // Triggers refetch
    } catch (err) {
      setError(err.message || "Could not update volunteer status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Debounced search for better UX
  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      setRefreshFlag(f => !f);
    }, 500);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line
  }, [search, filterStatus]);

  // Handle page changes
  const handlePageChange = newPage => {
    if (newPage < 1 || newPage > Math.ceil(totalCount / pageSize)) return;
    setPage(newPage);
  };

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-8 bg-white dark:bg-gray-900 rounded shadow ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 mb-0">Volunteers</h2>
        <div className="flex flex-wrap gap-2 sm:gap-4 items-end">
          {showSearch && (
            <input
              className="px-3 py-1.5 border rounded bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary-400 border-gray-300 dark:border-gray-700"
              placeholder="Search name, email or phone"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={loading}
              aria-label="Search volunteers"
              style={{ minWidth: 180 }}
            />
          )}
          <select
            className="px-2 py-1 rounded border text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            value={filterStatus}
            onChange={e => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter status"
          >
            {volunteerStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <button
            className="flex-shrink-0 px-3 py-1 border rounded bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition focus:ring-2 focus:ring-primary-500"
            onClick={() => setRefreshFlag(f => !f)}
            disabled={loading}
            title="Refresh"
            type="button"
          >
            &#8635; Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-800 rounded overflow-hidden">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-2 font-medium">#</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Phone</th>
              <th className="text-left px-4 py-2 font-medium">Applied</th>
              {showStatus && <th className="text-left px-4 py-2 font-medium">Status</th>}
              {adminView && <th className="text-left px-4 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? (
                <tr>
                  <td colSpan={adminView ? 7 : 6} className="text-center py-8">
                    <span className="inline-block animate-spin mr-2">&#9696;</span>Loading volunteers...
                  </td>
                </tr>
              )
              : (volunteers.length === 0 ? (
                <tr>
                  <td colSpan={adminView ? 7 : 6} className="text-center py-8 text-gray-400">
                    No volunteers found.
                  </td>
                </tr>
              ) : (
                volunteers.map((vol, idx) => (
                  <tr
                    key={vol.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer`}
                    onClick={onVolunteerClick ? () => onVolunteerClick(vol) : undefined}
                  >
                    <td className="px-4 py-2">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-4 py-2 font-semibold">{vol.name}</td>
                    <td className="px-4 py-2">{vol.email}</td>
                    <td className="px-4 py-2">{vol.phone || <span className="italic text-gray-400">N/A</span>}</td>
                    <td className="px-4 py-2" title={vol.created_at ? new Date(vol.created_at).toLocaleString() : ""}>
                      {vol.created_at
                        ? new Date(vol.created_at).toLocaleDateString()
                        : <span className="italic text-gray-400">No date</span>}
                    </td>
                    {showStatus && (
                      <td className="px-4 py-2 capitalize">
                        <span className={
                          vol.status === "accepted"
                            ? "text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded px-2 py-0.5 text-xs"
                            : vol.status === "pending"
                            ? "text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 rounded px-2 py-0.5 text-xs"
                            : vol.status === "rejected"
                            ? "text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded px-2 py-0.5 text-xs"
                            : ""
                        }>
                          {vol.status || "pending"}
                        </span>
                      </td>
                    )}
                    {adminView && (
                      <td className="px-4 py-2">
                        <div className="flex gap-2 items-center">
                          <select
                            value={vol.status || "pending"}
                            onChange={e => handleStatusChange(vol.id, e.target.value)}
                            disabled={updatingStatusId === vol.id}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700"
                            aria-label="Change status"
                          >
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          {updatingStatusId === vol.id && (
                            <span className="inline-block animate-spin text-primary-500">&#9696;</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ))
            }
          </tbody>
        </table>
      </div>

      {totalCount > pageSize && (
        <div className="flex flex-wrap items-center justify-between mt-5 gap-3">
          <span className="text-xs text-gray-600">
            {`Page ${page} of ${Math.ceil((totalCount || 0) / pageSize)}, `}
            {`Total: ${totalCount} volunteers`}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-100 text-sm font-medium"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded border bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:bg-gray-100 text-sm font-medium"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil((totalCount || 0) / pageSize) || loading}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

VolunteerList.propTypes = {
  /** Optionally provide initial volunteers (e.g., for SSR/hydration) */
  initialVolunteers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string,
      phone: PropTypes.string,
      status: PropTypes.string,
      created_at: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Date)
      ]),
    })
  ),
  /** If true, shows admin actions (change status) */
  adminView: PropTypes.bool,
  /** Show search bar */
  showSearch: PropTypes.bool,
  /** Show volunteer status as a column */
  showStatus: PropTypes.bool,
  /** Callback when a volunteer row is clicked */
  onVolunteerClick: PropTypes.func,
  className: PropTypes.string,
  /** Supabase project URL (will use global if not provided) */
  supabaseUrl: PropTypes.string,
  /** Supabase anon/public key (will use global if not provided) */
  supabaseKey: PropTypes.string,
  /** How many volunteers to show per page */
  pageSize: PropTypes.number,
};

export default VolunteerList;

