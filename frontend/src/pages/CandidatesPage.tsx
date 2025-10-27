import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faChevronLeft,
  faChevronRight,
  faGripVertical,
} from "@fortawesome/free-solid-svg-icons";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAllJobs, type StoredJob } from "../types/jobs";
import {
  getCandidatesForJob,
  JOB_CANDIDATE_STORAGE_KEY,
  JOB_CANDIDATE_UPDATED_EVENT,
  type StoredCandidate,
} from "../types/candidates";

type CandidatesPageProps = {
  onLogout: () => void;
};

type ColumnConfig = {
  key: string;
  label: string;
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
};

const COLUMN_HEADERS: ColumnConfig[] = [
  {
    key: "full_name",
    label: "Nama Lengkap",
    minWidth: 180,
    maxWidth: 360,
    defaultWidth: 230,
  },
  {
    key: "email",
    label: "Email",
    minWidth: 150,
    maxWidth: 420,
    defaultWidth: 200,
  },
  {
    key: "phone",
    label: "Phone Numbers",
    minWidth: 100,
    maxWidth: 320,
    defaultWidth: 160,
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    minWidth: 100,
    maxWidth: 260,
    defaultWidth: 150,
  },
  {
    key: "domicile",
    label: "Domicile",
    minWidth: 100,
    maxWidth: 260,
    defaultWidth: 170,
  },
  {
    key: "gender",
    label: "Gender",
    minWidth: 60,
    maxWidth: 120,
    defaultWidth: 80,
  },
  {
    key: "linkedin_link",
    label: "Link LinkedIn",
    minWidth: 220,
    maxWidth: 520,
    defaultWidth: 300,
  },
];

const resolveAttributeValue = (candidate: StoredCandidate, key: string) => {
  const attribute = candidate.attributes.find((item) => item.key === key);
  return attribute?.value?.trim() || "—";
};

function CandidatesPage({ onLogout }: CandidatesPageProps) {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<StoredJob | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Candidates table state
  const [candidates, setCandidates] = useState<StoredCandidate[]>([]);
  const buildDefaultWidths = () =>
    COLUMN_HEADERS.reduce<Record<string, number>>((accumulator, column) => {
      accumulator[column.key] = column.defaultWidth;
      return accumulator;
    }, {});
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    buildDefaultWidths()
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    COLUMN_HEADERS.map((col) => col.key)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const resizingColumnRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
    minWidth: number;
    maxWidth: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(
    null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of candidates per page

  useEffect(() => {
    if (!jobId) {
      navigate("/admin");
      return;
    }

    const jobs = getAllJobs();
    const foundJob = jobs.find((j: StoredJob) => j.id === jobId);

    if (!foundJob) {
      navigate("/admin");
      return;
    }

    setJob(foundJob);
  }, [jobId, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "l") {
        event.preventDefault();
        onLogout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onLogout]);

  // Sync candidates when job changes
  useEffect(() => {
    if (!job) return;
    setCandidates(getCandidatesForJob(job.id));
  }, [job]);

  // Listen for candidate updates
  useEffect(() => {
    if (typeof window === "undefined" || !job) return undefined;

    const syncCandidates = () => {
      setCandidates(getCandidatesForJob(job.id));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === JOB_CANDIDATE_STORAGE_KEY) {
        syncCandidates();
      }
    };

    const handleUpdateEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ jobId?: string }>;
      if (!customEvent.detail || customEvent.detail.jobId === job.id) {
        syncCandidates();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      JOB_CANDIDATE_UPDATED_EVENT,
      handleUpdateEvent as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        JOB_CANDIDATE_UPDATED_EVENT,
        handleUpdateEvent as EventListener
      );
    };
  }, [job]);

  // Reset selection when candidates or job changes
  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1); // Reset to first page when data changes
  }, [job?.id, candidates.length]);

  // Pagination logic
  const totalPages = Math.ceil(candidates.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCandidates = candidates.slice(startIndex, endIndex);

  // Handle page changes
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Reset column widths when job changes
  useEffect(() => {
    setColumnWidths(buildDefaultWidths());
    setColumnOrder(COLUMN_HEADERS.map((col) => col.key));
  }, [job?.id]);

  // Handle indeterminate checkbox state
  const allSelected =
    candidates.length > 0 && selectedIds.length === candidates.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < candidates.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Handle column resizing
  useEffect(() => {
    if (!isResizing) return undefined;

    const handleMouseMove = (event: MouseEvent) => {
      const context = resizingColumnRef.current;
      if (!context) return;
      const delta = event.clientX - context.startX;
      const nextWidth = Math.min(
        context.maxWidth,
        Math.max(context.minWidth, context.startWidth + delta)
      );
      setColumnWidths((previous) => {
        if (Math.abs((previous[context.key] ?? 0) - nextWidth) < 1) {
          return previous;
        }
        return { ...previous, [context.key]: nextWidth };
      });
    };

    const handleMouseUp = () => {
      resizingColumnRef.current = null;
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const beginResize = (
    event: ReactMouseEvent<HTMLButtonElement>,
    column: ColumnConfig
  ) => {
    event.preventDefault();
    const currentWidth = columnWidths[column.key] ?? column.defaultWidth;
    resizingColumnRef.current = {
      key: column.key,
      startX: event.clientX,
      startWidth: currentWidth,
      minWidth: column.minWidth,
      maxWidth: column.maxWidth,
    };
    setIsResizing(true);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((candidate) => candidate.id));
    }
  };

  const toggleCandidate = (candidateId: string) => {
    setSelectedIds((previous) =>
      previous.includes(candidateId)
        ? previous.filter((id) => id !== candidateId)
        : [...previous, candidateId]
    );
  };

  const handleDragStart = (
    event: ReactDragEvent<HTMLTableCellElement>,
    columnKey: string
  ) => {
    setDraggedColumnKey(columnKey);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", columnKey);
  };

  const handleDragOver = (
    event: ReactDragEvent<HTMLTableCellElement>,
    columnKey: string
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggedColumnKey && draggedColumnKey !== columnKey) {
      setDragOverColumnKey(columnKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumnKey(null);
  };

  const handleDrop = (
    event: ReactDragEvent<HTMLTableCellElement>,
    targetColumnKey: string
  ) => {
    event.preventDefault();
    setDragOverColumnKey(null);

    if (!draggedColumnKey || draggedColumnKey === targetColumnKey) {
      setDraggedColumnKey(null);
      return;
    }

    setColumnOrder((previous) => {
      const newOrder = [...previous];
      const draggedIndex = newOrder.indexOf(draggedColumnKey);
      const targetIndex = newOrder.indexOf(targetColumnKey);

      if (draggedIndex === -1 || targetIndex === -1) return previous;

      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumnKey);

      return newOrder;
    });

    setDraggedColumnKey(null);
  };

  const handleDragEnd = () => {
    setDraggedColumnKey(null);
    setDragOverColumnKey(null);
  };

  const orderedColumns = useMemo(() => {
    return columnOrder
      .map((key) => COLUMN_HEADERS.find((col) => col.key === key))
      .filter((col): col is ColumnConfig => col !== undefined);
  }, [columnOrder]);

  const jobTitle = useMemo(() => {
    return job?.formValues.jobName?.trim() || "Untitled Job";
  }, [job?.formValues.jobName]);

  const candidateCountLabel = useMemo(() => {
    if (!candidates.length) return "No candidates yet";
    return candidates.length === 1
      ? "1 candidate"
      : `${candidates.length} candidates`;
  }, [candidates.length]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  const handleBackToJobs = () => {
    navigate("/admin");
  };

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <p className="mt-4 text-sm text-slate-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6 shadow-sm sm:px-12 flex-shrink-0">
        <button
          type="button"
          onClick={handleBackToJobs}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back to Job List
        </button>

        <div className="relative">
          <button
            ref={profileButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
            aria-label="Buka menu profil admin"
            aria-expanded={isMenuOpen}
          >
            <FontAwesomeIcon icon={faCircleUser} className="h-6 w-6" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:bg-slate-50 py-2 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.55)] z-50"
            >
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex w-full max-w-full gap-6 pb-16 pt-8 px-6">
          <section className="flex flex-1 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                {jobTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>{candidateCountLabel}</span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Manage applicants linked to this opening
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto custom-scrollbar-thin">
                <table className="min-w-[960px] w-full table-fixed border-collapse text-sm text-slate-700">
                  <colgroup>
                    <col style={{ width: "56px" }} />
                    {orderedColumns.map((column) => (
                      <col
                        key={column.key}
                        style={{
                          width: `${
                            columnWidths[column.key] ?? column.defaultWidth
                          }px`,
                          minWidth: `${column.minWidth}px`,
                          maxWidth: `${column.maxWidth}px`,
                        }}
                      />
                    ))}
                  </colgroup>
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-14 pl-4 py-4 text-left align-middle">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          aria-label={
                            allSelected
                              ? "Deselect all candidates"
                              : "Select all candidates"
                          }
                          checked={allSelected}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                        />
                      </th>
                      {orderedColumns.map((column, index) => {
                        const isFirst = index === 0;
                        const isLast = index === orderedColumns.length - 1;
                        const isDragging = draggedColumnKey === column.key;
                        const isDragOver = dragOverColumnKey === column.key;
                        return (
                          <th
                            key={column.key}
                            scope="col"
                            draggable={!isResizing}
                            onDragStart={(event) =>
                              handleDragStart(event, column.key)
                            }
                            onDragOver={(event) =>
                              handleDragOver(event, column.key)
                            }
                            onDragLeave={handleDragLeave}
                            onDrop={(event) => handleDrop(event, column.key)}
                            onDragEnd={handleDragEnd}
                            className={`relative py-4 text-left font-semibold transition-opacity ${
                              isFirst ? "pl-4" : ""
                            } ${isLast ? "pr-4" : ""} ${
                              isDragging ? "opacity-40" : ""
                            } ${isDragOver ? "bg-sky-100" : ""} ${
                              !isResizing ? "cursor-move" : ""
                            }`}
                            style={{
                              width:
                                columnWidths[column.key] ?? column.defaultWidth,
                              minWidth: column.minWidth,
                              maxWidth: column.maxWidth,
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon
                                  icon={faGripVertical}
                                  className="h-3 w-3 text-slate-400"
                                  aria-hidden="true"
                                />
                                <span>{column.label}</span>
                              </div>
                              <button
                                type="button"
                                onMouseDown={(event) =>
                                  beginResize(event, column)
                                }
                                className="group relative flex h-full w-3 cursor-col-resize items-center justify-center self-stretch"
                                aria-label={`Resize column ${column.label}`}
                                role="separator"
                                aria-orientation="vertical"
                              >
                                <span className="pointer-events-none inline-flex h-[28px] w-px rounded-full bg-slate-300 group-hover:bg-sky-400" />
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCandidates.length === 0 ? (
                      <tr className="border-t border-slate-200">
                        <td
                          colSpan={orderedColumns.length + 1}
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="font-medium text-slate-600">
                              Belum ada kandidat
                            </span>
                            <span className="text-xs text-slate-400">
                              Kandidat yang melamar akan muncul di tabel ini
                              secara otomatis.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedCandidates.map((candidate) => {
                        const isSelected = selectedIds.includes(candidate.id);
                        return (
                          <tr
                            key={candidate.id}
                            className="border-t border-slate-200 transition hover:bg-slate-50/50"
                          >
                            <td className="pl-4 py-4 align-middle">
                              <input
                                type="checkbox"
                                aria-label={`Select candidate ${resolveAttributeValue(
                                  candidate,
                                  "full_name"
                                )}`}
                                checked={isSelected}
                                onChange={() => toggleCandidate(candidate.id)}
                                className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                              />
                            </td>
                            {orderedColumns.map((column, index) => {
                              const width =
                                columnWidths[column.key] ?? column.defaultWidth;
                              const value = resolveAttributeValue(
                                candidate,
                                column.key
                              );
                              const widthStyle = {
                                width,
                                minWidth: column.minWidth,
                                maxWidth: column.maxWidth,
                              };
                              const isFirst = index === 0;
                              const isLast =
                                index === orderedColumns.length - 1;
                              if (column.key === "linkedin_link") {
                                const isLink = value.startsWith("http");
                                return (
                                  <td
                                    key={column.key}
                                    className={`py-4 text-sm font-medium text-sky-500 ${
                                      isFirst ? "pl-4" : ""
                                    } ${isLast ? "pr-4" : ""}`}
                                    style={widthStyle}
                                  >
                                    {isLink ? (
                                      <a
                                        href={value}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block truncate text-sky-500 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-600"
                                        title={value}
                                      >
                                        {value}
                                      </a>
                                    ) : (
                                      <span
                                        className="text-slate-500"
                                        title={value}
                                      >
                                        {value}
                                      </span>
                                    )}
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={column.key}
                                  className={`py-4 text-sm text-slate-700 ${
                                    isFirst ? "pl-4" : ""
                                  } ${isLast ? "pr-4" : ""}`}
                                  style={widthStyle}
                                  title={value}
                                >
                                  <span className="block truncate">
                                    {value}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(endIndex, candidates.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{candidates.length}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        type="button"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <FontAwesomeIcon
                          icon={faChevronLeft}
                          className="h-5 w-5"
                        />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === currentPage
                                ? "z-10 bg-sky-500 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                                : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="h-5 w-5"
                        />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default CandidatesPage;
