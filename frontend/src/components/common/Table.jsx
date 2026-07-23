import { useState, useMemo } from "react";

const Table = ({
  columns,
  data = [],
  loading = false,
  emptyMessage = "No data found",
  emptyIcon = "📭",
  onRowClick,
  striped = true,
  stickyHeader = false,
  pagination = null,
  onPageChange,
  searchable = false,
  searchPlaceholder = "Search...",
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : null;
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const SkeletonRow = () => (
    <tr>
      {columns.map((_, i) => (
        <td key={i} className="table-td">
          <div className="h-4 rounded-lg shimmer" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead className={`table-head ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.accessor}
                  className={`table-th ${col.sortable ? "cursor-pointer select-none hover:bg-gray-100 transition-colors" : ""}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className="text-gray-300 text-xs">
                        {sortKey === col.accessor ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16">
                  <div className="text-5xl mb-3">{emptyIcon}</div>
                  <p className="text-gray-400 font-medium text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              sorted.map((row, rowIdx) => (
                <tr
                  key={row._id || row.id || rowIdx}
                  className={`table-row ${striped && rowIdx % 2 === 1 ? "bg-gray-50/50" : ""} ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.accessor} className="table-td" style={{ width: col.width }}>
                      {col.render ? col.render(row[col.accessor], row, rowIdx) : (row[col.accessor] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages} · {pagination.totalItems} total
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="w-8 h-8 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pagination.currentPage === page
                      ? "bg-primary-600 text-white"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="w-8 h-8 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;