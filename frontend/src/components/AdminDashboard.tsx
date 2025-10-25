import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faUserTie,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import JobOpeningModal from "./JobOpeningModal";
import type { DraftJob } from "../types/jobs";
import { JOB_DRAFT_STORAGE_KEY, parseDraftJobs } from "../types/jobs";

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const formatDraftSavedAt = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Saved just now";
  }

  return `Saved ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
};

const buildSalaryLabel = (formValues: DraftJob["formValues"]) => {
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

type AdminDashboardProps = {
  onLogout: () => void;
};

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [draftJobs, setDraftJobs] = useState<DraftJob[]>(() =>
    typeof window !== "undefined"
      ? parseDraftJobs(window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY))
      : []
  );
  const [activeDraft, setActiveDraft] = useState<DraftJob | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDraftJobs(
      parseDraftJobs(window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY))
    );
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
    onLogout();
  };

  const handleDraftSaved = (draft: DraftJob) => {
    setDraftJobs((prev) => {
      const filtered = prev.filter((item) => item.id !== draft.id);
      return [draft, ...filtered];
    });
    setActiveDraft((prev) => (prev && prev.id === draft.id ? draft : prev));
  };

  const hasDrafts = draftJobs.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 shadow-sm bg-white px-8 py-6 sm:px-12">
        <span className="text-2xl font-semibold">Job List</span>
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
              className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.55)]"
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
        <div className="mx-auto flex w-full flex-col gap-12 pb-16 pt-12 px-2 md:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="relative flex-1">
              <input
                type="search"
                placeholder="Search by job details"
                className="w-full rounded-xl border border-slate-200 bg-white px-6 py-4 pr-16 text-sm text-slate-600 shadow-[0_14px_40px_-35px_rgba(15,23,42,0.8)] transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500"
              />
            </div>
          </div>

          {hasDrafts ? (
            <section className="rounded-3xl border border-slate-100 bg-white px-6 py-8 shadow-[0_40px_90px_-65px_rgba(15,23,42,0.45)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-lg font-semibold uppercase tracking-wide">
                    Drafts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDraft(null);
                    setIsJobModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                >
                  Create a new job
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  const salaryLabel = buildSalaryLabel(draft.formValues);
                  return (
                    <article
                      key={draft.id}
                      className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.55)] transition hover:shadow-[0_45px_95px_-60px_rgba(15,23,42,0.55)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                          Draft
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {formatDraftSavedAt(draft.savedAt)}
                        </span>
                      </div>
                      <h3 className="mt-6 text-lg font-semibold text-slate-900">
                        {title}
                      </h3>

                      {(jobTypeLabel || candidatesLabel) && (
                        <div className="mt-4 flex flex-wrap gap-2">
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

                      <div className="mt-auto flex flex-col gap-4 pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          {salaryLabel && (
                            <p className="text-sm font-medium text-slate-700">
                              {salaryLabel}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDraft(draft);
                              setIsJobModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 self-start sm:self-auto"
                          >
                            Manage job
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
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
                Get started by creating your first job post so candidates can
                discover the role.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveDraft(null);
                  setIsJobModalOpen(true);
                }}
                className="mt-10 rounded-xl bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
              >
                Create a new job
              </button>
            </section>
          )}
        </div>
      </main>

      <JobOpeningModal
        isOpen={isJobModalOpen}
        initialDraft={activeDraft}
        onClose={() => {
          setIsJobModalOpen(false);
          setActiveDraft(null);
        }}
        onDraftSaved={handleDraftSaved}
        onDraftDeleted={(draftId) => {
          setDraftJobs((prev) => prev.filter((draft) => draft.id !== draftId));
          setActiveDraft(null);
        }}
      />
    </div>
  );
}

export default AdminDashboard;
