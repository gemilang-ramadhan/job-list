import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faUserTie,
  faSearch,
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
} from "../types/jobs";

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
    return { drafts: [] as StoredJob[], active: [] as StoredJob[] };
  }

  const rawValue = window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY);
  return {
    drafts: parseDraftJobs(rawValue),
    active: parseActiveJobs(rawValue),
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
  const [selectedJob, setSelectedJob] = useState<StoredJob | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<{
    key: number;
    message: string;
    variant: "success" | "info" | "warning" | "error";
  } | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { drafts, active } = getJobsFromStorage();
    setDraftJobs(drafts);
    setActiveJobs(active);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isMenuOpen) return;
      const target = event.target as Node;
      if (
        !profileButtonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

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
  const hasAnyJobs = hasDrafts || hasActiveJobs;

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
              className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.55)] z-50"
            >
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Logout
                <span className="text-xs text-slate-400">Ctrl+L</span>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-6 py-4 pr-16 text-sm text-slate-600 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500"
                />
              </div>

              {hasAnyJobs ? (
                <section className="flex flex-col gap-10">
                  {hasActiveJobs && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                          Active Jobs
                        </h2>
                        <span className="text-sm font-medium text-slate-500">
                          {activeJobs.length} active
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-6">
                        {activeJobs.map((job) => {
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

                          return (
                            <article
                              key={job.id}
                              className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-md transition hover:shadow-md"
                            >
                              <div className="flex items-start gap-3">
                                <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                  Active
                                </span>
                                <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                  started on {formattedDate}
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

                  {hasDrafts && (
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                          Draft Jobs
                        </h2>
                        <span className="text-sm font-medium text-slate-500">
                          {draftJobs.length} draft
                        </span>
                      </div>
                      <div className="mt-4 flex flex-col gap-6">
                        {draftJobs.map((draft) => {
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

                          return (
                            <article
                              key={draft.id}
                              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition hover:shadow-md"
                            >
                              <div className="flex items-start gap-3">
                                <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                                  Draft
                                </span>
                                <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                  started on {formattedDate}
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJob(draft);
                                    setIsJobModalOpen(true);
                                  }}
                                  className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
                                >
                                  Manage Job
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
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
          setSelectedJob(null);
        }}
      />
    </div>
  );
}

export default AdminDashboard;
