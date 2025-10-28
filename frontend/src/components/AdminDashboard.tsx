import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faUserTie,
  faSearch,
  faChevronDown,
  faArrowUpWideShort,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobOpeningModal from "./JobOpeningModal";
import NotificationBanner from "./NotificationBanner";
import type { StoredJob } from "../types/jobs";
import {
  JOB_DRAFT_STORAGE_KEY,
  parseDraftJobs,
  parseActiveJobs,
  parseInactiveJobs,
} from "../types/jobs";
import type { StoredCandidate } from "../types/candidates";
import {
  JOB_CANDIDATE_STORAGE_KEY,
  JOB_CANDIDATE_UPDATED_EVENT,
  getCandidatesFromStorage,
} from "../types/candidates";

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const buildSalaryLabel = (formValues: StoredJob["formValues"]) => {
  const { minSalary, maxSalary } = formValues;
  if (minSalary && maxSalary) {
    return `Rp${minSalary} - Rp${maxSalary}`;
  }
  if (minSalary) {
    return `Starting Rp${minSalary}`;
  }
  if (maxSalary) {
    return `Up to Rp${maxSalary}`;
  }
  return "";
};

const getJobsFromStorage = () => {
  if (typeof window === "undefined") {
    return {
      drafts: [] as StoredJob[],
      active: [] as StoredJob[],
      inactive: [] as StoredJob[],
    };
  }

  const rawValue = window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY);
  return {
    drafts: parseDraftJobs(rawValue),
    active: parseActiveJobs(rawValue),
    inactive: parseInactiveJobs(rawValue),
  };
};

type AdminDashboardProps = {
  onLogout: () => void;
};

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [draftJobs, setDraftJobs] = useState<StoredJob[]>(
    () => getJobsFromStorage().drafts
  );
  const [activeJobs, setActiveJobs] = useState<StoredJob[]>(
    () => getJobsFromStorage().active
  );
  const [inactiveJobs, setInactiveJobs] = useState<StoredJob[]>(
    () => getJobsFromStorage().inactive
  );
  const [candidates, setCandidates] = useState<StoredCandidate[]>(() =>
    getCandidatesFromStorage()
  );
  const [selectedJob, setSelectedJob] = useState<StoredJob | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "draft"
  >("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "oldest" | "highest-applicants"
  >("recent");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sortButtonDesktopRef = useRef<HTMLButtonElement>(null);
  const sortDropdownDesktopRef = useRef<HTMLDivElement>(null);
  const sortButtonMobileRef = useRef<HTMLButtonElement>(null);
  const sortDropdownMobileRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<{
    key: number;
    message: string;
    variant: "success" | "info" | "warning" | "error";
  } | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { drafts, active, inactive } = getJobsFromStorage();
    setDraftJobs(drafts);
    setActiveJobs(active);
    setInactiveJobs(inactive);
    setCandidates(getCandidatesFromStorage());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === JOB_CANDIDATE_STORAGE_KEY) {
        setCandidates(getCandidatesFromStorage());
      }
    };

    const handleCandidateUpdate = () => {
      setCandidates(getCandidatesFromStorage());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(JOB_CANDIDATE_UPDATED_EVENT, handleCandidateUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        JOB_CANDIDATE_UPDATED_EVENT,
        handleCandidateUpdate
      );
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (isMenuOpen) {
        if (
          !profileButtonRef.current?.contains(target) &&
          !menuRef.current?.contains(target)
        ) {
          setIsMenuOpen(false);
        }
      }
      if (isSortDropdownOpen) {
        if (
          !sortButtonDesktopRef.current?.contains(target) &&
          !sortDropdownDesktopRef.current?.contains(target) &&
          !sortButtonMobileRef.current?.contains(target) &&
          !sortDropdownMobileRef.current?.contains(target)
        ) {
          setIsSortDropdownOpen(false);
        }
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsSortDropdownOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, isSortDropdownOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    setSelectedJob(null);
    onLogout();
  };

  const handleNavigateToCandidates = (job: StoredJob) => {
    navigate(`/admin/candidates/${job.id}`);
  };

  const handleJobPersisted = (
    job: StoredJob,
    options?: { isPublishingNew?: boolean; isActiveUpdate?: boolean }
  ) => {
    setDraftJobs((prev) => {
      const filtered = prev.filter((item) => item.id !== job.id);
      return job.status === "draft" ? [job, ...filtered] : filtered;
    });
    setActiveJobs((prev) => {
      const filtered = prev.filter((item) => item.id !== job.id);
      return job.status === "active" ? [job, ...filtered] : filtered;
    });
    setInactiveJobs((prev) => {
      const filtered = prev.filter((item) => item.id !== job.id);
      return job.status === "inactive" ? [job, ...filtered] : filtered;
    });
    setSelectedJob((prev) => (prev && prev.id === job.id ? job : prev));

    if (job.status === "active" && options?.isActiveUpdate) {
      const nextKey = Date.now();
      notificationKeyRef.current = nextKey;
      setNotification({
        key: nextKey,
        message: "Job details updated successfully",
        variant: "success",
      });
      setIsNotificationOpen(true);
      return;
    }

    if (job.status === "active" && options?.isPublishingNew) {
      const nextKey = Date.now();
      notificationKeyRef.current = nextKey;
      setNotification({
        key: nextKey,
        message: "Job vacancy successfully created",
        variant: "success",
      });
      setIsNotificationOpen(true);
    }
  };

  const handleNotificationDismiss = () => {
    setIsNotificationOpen(false);
    const activeKey = notificationKeyRef.current;
    window.setTimeout(() => {
      if (notificationKeyRef.current === activeKey) {
        setNotification(null);
      }
    }, 350);
  };

  const hasDrafts = draftJobs.length > 0;
  const hasActiveJobs = activeJobs.length > 0;
  const hasInactiveJobs = inactiveJobs.length > 0;
  const hasAnyJobs = hasDrafts || hasActiveJobs || hasInactiveJobs;

  const filterJobsByName = (jobs: StoredJob[]) => {
    if (!debouncedSearchQuery.trim()) {
      return jobs;
    }
    const query = debouncedSearchQuery.toLowerCase().trim();
    return jobs.filter((job) => {
      const jobName = job.formValues.jobName?.toLowerCase().trim() || "";
      return jobName.includes(query);
    });
  };

  const sortJobs = (jobs: StoredJob[]) => {
    const jobsWithApplicants = jobs.map((job) => ({
      job,
      applicantCount: candidates.filter((c) => c.jobId === job.id).length,
    }));

    if (sortBy === "oldest") {
      return jobsWithApplicants
        .sort((a, b) => {
          const dateA = new Date(a.job.publishedAt ?? a.job.savedAt).getTime();
          const dateB = new Date(b.job.publishedAt ?? b.job.savedAt).getTime();
          return dateA - dateB;
        })
        .map((item) => item.job);
    }

    if (sortBy === "highest-applicants") {
      return jobsWithApplicants
        .sort((a, b) => b.applicantCount - a.applicantCount)
        .map((item) => item.job);
    }

    // Default: recent (newest first)
    return jobsWithApplicants
      .sort((a, b) => {
        const dateA = new Date(a.job.publishedAt ?? a.job.savedAt).getTime();
        const dateB = new Date(b.job.publishedAt ?? b.job.savedAt).getTime();
        return dateB - dateA;
      })
      .map((item) => item.job);
  };

  const filteredActiveJobs = sortJobs(filterJobsByName(activeJobs));
  const filteredInactiveJobs = sortJobs(filterJobsByName(inactiveJobs));
  const filteredDraftJobs = sortJobs(filterJobsByName(draftJobs));

  const shouldShowActiveSection =
    statusFilter === "all" || statusFilter === "active";
  const shouldShowInactiveSection =
    statusFilter === "all" || statusFilter === "inactive";
  const shouldShowDraftSection =
    statusFilter === "all" || statusFilter === "draft";

  const hasFilteredActiveJobs =
    filteredActiveJobs.length > 0 && shouldShowActiveSection;
  const hasFilteredInactiveJobs =
    filteredInactiveJobs.length > 0 && shouldShowInactiveSection;
  const hasFilteredDrafts =
    filteredDraftJobs.length > 0 && shouldShowDraftSection;
  const hasFilteredJobs =
    hasFilteredActiveJobs || hasFilteredInactiveJobs || hasFilteredDrafts;

  const formatDate = (value?: string) => {
    if (!value) return "3 Sep 2025";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return "3 Sep 2025";
    }
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  };

  return (
    <div className="flex h-screen flex-col bg-white text-slate-900 overflow-hidden">
      {notification && (
        <NotificationBanner
          key={notification.key}
          message={notification.message}
          variant={notification.variant}
          isOpen={isNotificationOpen}
          duration={2000}
          onDismiss={handleNotificationDismiss}
        />
      )}
      <header className="flex items-center justify-between border-b border-slate-200 shadow-sm bg-white px-8 py-6 sm:px-12 flex-shrink-0">
        <span className="text-2xl font-semibold text-slate-900">Job List</span>
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
                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-red-600 "
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex w-full max-w-[1400px] gap-6 pb-16 pt-8 px-6 md:px-8">
          <>
            <div className="flex flex-1 flex-col gap-8">
              <div className="relative w-full">
                <input
                  type="search"
                  placeholder="Search by job details"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-6 py-4 pr-16 text-sm text-slate-600 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500"
                />
              </div>

              <div className="hidden md:flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                      statusFilter === "all"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                      statusFilter === "active"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("inactive")}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                      statusFilter === "inactive"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Inactive
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("draft")}
                    className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                      statusFilter === "draft"
                        ? "bg-amber-400 text-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Draft
                  </button>
                </div>

                <div className="relative">
                  <button
                    ref={sortButtonDesktopRef}
                    type="button"
                    onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
                    aria-label="Sort jobs"
                    aria-expanded={isSortDropdownOpen}
                  >
                    <FontAwesomeIcon
                      icon={faArrowUpWideShort}
                      className="h-4 w-4"
                    />
                    <span>
                      Sort by:{" "}
                      {sortBy === "recent"
                        ? "Recent"
                        : sortBy === "oldest"
                        ? "Oldest"
                        : "Highest Applicants"}
                    </span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`h-3 w-3 transition-transform ${
                        isSortDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isSortDropdownOpen && (
                    <div
                      ref={sortDropdownDesktopRef}
                      className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg z-50"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("recent");
                          setIsSortDropdownOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition ${
                          sortBy === "recent"
                            ? "bg-sky-50 text-sky-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Sort by Recent
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("oldest");
                          setIsSortDropdownOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition ${
                          sortBy === "oldest"
                            ? "bg-sky-50 text-sky-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Sort by Oldest
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy("highest-applicants");
                          setIsSortDropdownOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition ${
                          sortBy === "highest-applicants"
                            ? "bg-sky-50 text-sky-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Highest Applicants
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:hidden sticky top-0 z-40 bg-white pt-4 pb-2 -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedJob(null);
                    setIsJobModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                >
                  Create a new job
                </button>
              </div>

              {hasAnyJobs ? (
                <section className="flex flex-col gap-10">
                  <div className="md:hidden flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                          statusFilter === "all"
                            ? "bg-sky-500 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("active")}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                          statusFilter === "active"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("inactive")}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                          statusFilter === "inactive"
                            ? "bg-rose-500 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Inactive
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("draft")}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                          statusFilter === "draft"
                            ? "bg-amber-400 text-slate-900 shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Draft
                      </button>
                    </div>

                    <div className="relative">
                      <button
                        ref={sortButtonMobileRef}
                        type="button"
                        onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
                        aria-label="Sort jobs"
                        aria-expanded={isSortDropdownOpen}
                      >
                        <FontAwesomeIcon
                          icon={faArrowUpWideShort}
                          className="h-4 w-4"
                        />
                        <span>
                          Sort by:{" "}
                          {sortBy === "recent"
                            ? "Recent"
                            : sortBy === "oldest"
                            ? "Oldest"
                            : "Highest Applicants"}
                        </span>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`h-3 w-3 transition-transform ${
                            isSortDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isSortDropdownOpen && (
                        <div
                          ref={sortDropdownMobileRef}
                          className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg z-50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSortBy("recent");
                              setIsSortDropdownOpen(false);
                            }}
                            className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition ${
                              sortBy === "recent"
                                ? "bg-sky-50 text-sky-600"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Sort by Recent
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortBy("oldest");
                              setIsSortDropdownOpen(false);
                            }}
                            className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition ${
                              sortBy === "oldest"
                                ? "bg-sky-50 text-sky-600"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Sort by Oldest
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortBy("highest-applicants");
                              setIsSortDropdownOpen(false);
                            }}
                            className={`flex w-full items-center px-4 py-2.5 text-sm font-medium transition ${
                              sortBy === "highest-applicants"
                                ? "bg-sky-50 text-sky-600"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Highest Applicants
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasFilteredActiveJobs && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                          Active Jobs
                        </h2>
                        <span className="text-sm font-medium text-slate-500">
                          {filteredActiveJobs.length} active
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-6">
                        {filteredActiveJobs.map((job) => {
                          const title =
                            job.formValues.jobName?.trim() || "Untitled job";
                          const jobTypeValue = job.formValues.jobType?.trim();
                          const jobTypeLabel = jobTypeValue
                            ? JOB_TYPE_LABELS[jobTypeValue] || jobTypeValue
                            : "";
                          const candidatesValue =
                            job.formValues.candidatesNeeded?.trim() || "";
                          const candidatesLabel = candidatesValue
                            ? `${candidatesValue} candidate${
                                candidatesValue === "1" ? "" : "s"
                              } needed`
                            : "";
                          const salaryLabel = buildSalaryLabel(job.formValues);
                          const formattedDate = formatDate(
                            job.publishedAt ?? job.savedAt
                          );
                          const applicationCount = candidates.filter(
                            (c) => c.jobId === job.id
                          ).length;
                          const applicationLabel =
                            applicationCount === 1
                              ? "1 application"
                              : `${applicationCount} applications`;

                          return (
                            <article
                              key={job.id}
                              className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-md transition hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                    Active
                                  </span>
                                  <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                    started on {formattedDate}
                                  </span>
                                </div>
                                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                                  <span className="sm:hidden">
                                    {applicationCount}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {applicationLabel}
                                  </span>
                                </span>
                              </div>

                              <h3 className="text-xl font-semibold text-slate-900">
                                {title}
                              </h3>

                              {(jobTypeLabel || candidatesLabel) && (
                                <div className="flex flex-wrap gap-2">
                                  {jobTypeLabel && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                      {jobTypeLabel}
                                    </span>
                                  )}
                                  {candidatesLabel && (
                                    <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                                      {candidatesLabel}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div
                                className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
                                  salaryLabel
                                    ? "sm:justify-between"
                                    : "sm:justify-end"
                                }`}
                              >
                                {salaryLabel && (
                                  <p className="text-base font-medium text-slate-700">
                                    {salaryLabel}
                                  </p>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNavigateToCandidates(job)
                                    }
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-auto sm:min-w-[160px]"
                                  >
                                    Manage Candidates
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedJob(job);
                                      setIsJobModalOpen(true);
                                    }}
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 sm:w-auto sm:min-w-[160px]"
                                  >
                                    Manage Job
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasFilteredInactiveJobs && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                          Inactive Jobs
                        </h2>
                        <span className="text-sm font-medium text-slate-500">
                          {filteredInactiveJobs.length} inactive
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-6">
                        {filteredInactiveJobs.map((job) => {
                          const title =
                            job.formValues.jobName?.trim() || "Untitled job";
                          const jobTypeValue = job.formValues.jobType?.trim();
                          const jobTypeLabel = jobTypeValue
                            ? JOB_TYPE_LABELS[jobTypeValue] || jobTypeValue
                            : "";
                          const candidatesValue =
                            job.formValues.candidatesNeeded?.trim() || "";
                          const candidatesLabel = candidatesValue
                            ? `${candidatesValue} candidate${
                                candidatesValue === "1" ? "" : "s"
                              } needed`
                            : "";
                          const salaryLabel = buildSalaryLabel(job.formValues);
                          const formattedDate = formatDate(
                            job.publishedAt ?? job.savedAt
                          );
                          const applicationCount = candidates.filter(
                            (c) => c.jobId === job.id
                          ).length;
                          const applicationLabel =
                            applicationCount === 1
                              ? "1 application"
                              : `${applicationCount} applications`;

                          return (
                            <article
                              key={job.id}
                              className="flex flex-col gap-4 rounded-2xl border border-rose-100 bg-white p-6 shadow-md transition hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <span className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                                    Inactive
                                  </span>
                                  <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                    started on {formattedDate}
                                  </span>
                                </div>
                                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                                  <span className="sm:hidden">
                                    {applicationCount}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {applicationLabel}
                                  </span>
                                </span>
                              </div>

                              <h3 className="text-xl font-semibold text-slate-900">
                                {title}
                              </h3>

                              {(jobTypeLabel || candidatesLabel) && (
                                <div className="flex flex-wrap gap-2">
                                  {jobTypeLabel && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                      {jobTypeLabel}
                                    </span>
                                  )}
                                  {candidatesLabel && (
                                    <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                                      {candidatesLabel}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div
                                className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
                                  salaryLabel
                                    ? "sm:justify-between"
                                    : "sm:justify-end"
                                }`}
                              >
                                {salaryLabel && (
                                  <p className="text-base font-medium text-slate-700">
                                    {salaryLabel}
                                  </p>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNavigateToCandidates(job)
                                    }
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-auto sm:min-w-[160px]"
                                  >
                                    Manage Candidates
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedJob(job);
                                      setIsJobModalOpen(true);
                                    }}
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 sm:w-auto sm:min-w-[160px]"
                                  >
                                    Manage Job
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasFilteredDrafts && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                          Draft Jobs
                        </h2>
                        <span className="text-sm font-medium text-slate-500">
                          {filteredDraftJobs.length} draft
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-6">
                        {filteredDraftJobs.map((draft) => {
                          const title =
                            draft.formValues.jobName?.trim() || "Untitled job";
                          const jobTypeValue = draft.formValues.jobType?.trim();
                          const jobTypeLabel = jobTypeValue
                            ? JOB_TYPE_LABELS[jobTypeValue] || jobTypeValue
                            : "";
                          const candidatesValue =
                            draft.formValues.candidatesNeeded?.trim() || "";
                          const candidatesLabel = candidatesValue
                            ? `${candidatesValue} candidate${
                                candidatesValue === "1" ? "" : "s"
                              } needed`
                            : "";
                          const salaryLabel = buildSalaryLabel(
                            draft.formValues
                          );
                          const formattedDate = formatDate(draft.savedAt);
                          const applicationCount = candidates.filter(
                            (c) => c.jobId === draft.id
                          ).length;
                          const applicationLabel =
                            applicationCount === 1
                              ? "1 application"
                              : `${applicationCount} applications`;

                          return (
                            <article
                              key={draft.id}
                              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition hover:shadow-md"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                    Draft
                                  </span>
                                  <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                    started on {formattedDate}
                                  </span>
                                </div>
                                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                                  <span className="sm:hidden">
                                    {applicationCount}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {applicationLabel}
                                  </span>
                                </span>
                              </div>

                              <h3 className="text-xl font-semibold text-slate-900">
                                {title}
                              </h3>

                              {(jobTypeLabel || candidatesLabel) && (
                                <div className="flex flex-wrap gap-2">
                                  {jobTypeLabel && (
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                      {jobTypeLabel}
                                    </span>
                                  )}
                                  {candidatesLabel && (
                                    <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                                      {candidatesLabel}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div
                                className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
                                  salaryLabel
                                    ? "sm:justify-between"
                                    : "sm:justify-end"
                                }`}
                              >
                                {salaryLabel && (
                                  <p className="text-base font-medium text-slate-700">
                                    {salaryLabel}
                                  </p>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleNavigateToCandidates(draft)
                                    }
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-auto sm:min-w-[160px]"
                                  >
                                    Manage Candidates
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedJob(draft);
                                      setIsJobModalOpen(true);
                                    }}
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 sm:w-auto sm:min-w-[160px]"
                                  >
                                    Manage Job
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!hasFilteredJobs && debouncedSearchQuery.trim() && (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="h-16 w-16 text-slate-300"
                      />
                      <h3 className="mt-6 text-lg font-semibold text-slate-900">
                        No jobs found
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-slate-500">
                        No jobs match "{debouncedSearchQuery}". Try a different
                        search term.
                      </p>
                    </div>
                  )}
                </section>
              ) : (
                <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 py-8 text-center shadow-[0_40px_90px_-65px_rgba(15,23,42,0.45)]">
                  <div className="flex h-56 w-56 items-center justify-center rounded-full bg-sky-50">
                    <FontAwesomeIcon
                      icon={faUserTie}
                      className="h-24 w-24 text-sky-500"
                    />
                  </div>
                  <h2 className="mt-12 text-2xl font-semibold text-slate-900">
                    No job openings available
                  </h2>
                  <p className="mt-4 max-w-md text-sm text-slate-500">
                    Get started by creating your first job post so candidates
                    can discover the role.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(null);
                      setIsJobModalOpen(true);
                    }}
                    className="mt-10 rounded-xl bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                  >
                    Create a new job
                  </button>
                </section>
              )}
            </div>

            {hasAnyJobs && (
              <aside className="hidden lg:block lg:w-80 flex-shrink-0">
                <div className="sticky top-8 rounded-2xl bg-slate-900 px-8 py-6 text-white shadow-lg">
                  <h2 className="text-xl font-semibold">
                    Recruit the best candidates
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Create jobs, invite, and hire with ease
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(null);
                      setIsJobModalOpen(true);
                    }}
                    className="mt-6 w-full inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                  >
                    Create a new job
                  </button>
                </div>
              </aside>
            )}
          </>
        </div>
      </main>

      <JobOpeningModal
        isOpen={isJobModalOpen}
        initialDraft={selectedJob}
        onClose={() => {
          setIsJobModalOpen(false);
          setSelectedJob(null);
        }}
        onDraftSaved={handleJobPersisted}
        onDraftDeleted={(draftId) => {
          setDraftJobs((prev) => prev.filter((draft) => draft.id !== draftId));
          setActiveJobs((prev) => prev.filter((job) => job.id !== draftId));
          setInactiveJobs((prev) => prev.filter((job) => job.id !== draftId));
          setSelectedJob(null);
        }}
      />
    </div>
  );
}

export default AdminDashboard;
