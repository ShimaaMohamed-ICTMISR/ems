import type { Notification } from "../../store/notificationSlice";

interface Props {
  loopedItem: Notification[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
}

export default function PaginationBar({
  loopedItem,
  totalPages,
  totalItems,
  currentPage,
  itemsPerPage,
  setCurrentPage,
}: Props) {
  // Show pagination info even if only 1 page
  if (loopedItem.length === 0) return null;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pages = [];

  // If only 1 page, show simplified pagination
  //   if (totalPages <= 1) {
  //     return (
  //       <div className="pagination-container">
  //         <div className="pagination-info">
  //           Showing {loopedItem.length} of {totalItems || loopedItem.length}{" "}
  //           notifications
  //         </div>
  //       </div>
  //     );
  //   }

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Previous button
  pages.push(
    <button
      key="prev"
      className="pagination-btn pagination-arrow"
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      <i className="bi bi-chevron-left"></i>
    </button>,
  );

  // First page
  if (startPage > 1) {
    pages.push(
      <button
        key={1}
        className="pagination-btn"
        onClick={() => handlePageChange(1)}
      >
        1
      </button>,
    );
    if (startPage > 2) {
      pages.push(
        <span key="dots1" className="pagination-dots">
          ...
        </span>,
      );
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        className={`pagination-btn ${currentPage === i ? "active" : ""}`}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </button>,
    );
  }

  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="dots2" className="pagination-dots">
          ...
        </span>,
      );
    }
    pages.push(
      <button
        key={totalPages}
        className="pagination-btn"
        onClick={() => handlePageChange(totalPages)}
      >
        {totalPages}
      </button>,
    );
  }

  // Next button
  pages.push(
    <button
      key="next"
      className="pagination-btn pagination-arrow"
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      <i className="bi bi-chevron-right"></i>
    </button>,
  );

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
        notifications
      </div>
      <div className="pagination-controls">{pages}</div>
    </div>
  );
}
