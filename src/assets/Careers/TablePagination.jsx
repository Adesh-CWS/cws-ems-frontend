const TablePagination = ({
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  totalCount,
}) => {
        const from = totalCount === 0 ? 0 : page * rowsPerPage + 1;
        const to = Math.min((page + 1) * rowsPerPage, totalCount);

        return (
          <div className="d-flex justify-content-end align-items-center gap-3 mt-3">

            {/* Rows per page */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted">Rows per page:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: "70px" }}
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            {/* Count */}
            <span className="text-muted">
              {from}-{to} of {totalCount}
            </span>

            {/* Arrows */}
            <div className="d-flex align-items-center gap-2">
              <button
                className="pagination-arrow"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                >
                  ‹
              </button>

              <button
                className="pagination-arrow"
                disabled={to >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                >
                ›
              </button>
            </div>
          </div>
        );
      };
      export default TablePagination;