import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faMagnifyingGlass,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredJob } from "../types/jobs";
import { JOB_DRAFT_STORAGE_KEY, parseActiveJobs } from "../types/jobs";
import {
  JOB_CANDIDATE_STORAGE_KEY,
  JOB_CANDIDATE_UPDATED_EVENT,
  getCandidatesFromStorage,
} from "../types/candidates";
import ApplyJobModal from "./ApplyJobModal";
import JobDetailsModal from "./JobDetailsModal";

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
};

const JOB_TYPE_BADGE_CLASSES: Record<string, string> = {
  "full-time": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "part-time": "bg-sky-50 text-sky-600 border border-sky-200",
  contract: "bg-amber-50 text-amber-600 border border-amber-200",
  internship: "bg-violet-50 text-violet-600 border border-violet-200",
};

type UserDashboardProps = {
  onLogout: () => void;
};

function UserDashboard({ onLogout }: UserDashboardProps) {
  const [jobs, setJobs] = useState<StoredJob[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY);
    return parseActiveJobs(raw);
  });
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const candidates = getCandidatesFromStorage();
    return new Set(candidates.map((c) => c.jobId));
  });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

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

  useEffect(() => {
    const syncJobsFromStorage = () => {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY);
      setJobs(parseActiveJobs(raw));
    };

    syncJobsFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === JOB_DRAFT_STORAGE_KEY) {
        syncJobsFromStorage();
      }
      if (event.key === JOB_CANDIDATE_STORAGE_KEY) {
        const candidates = getCandidatesFromStorage();
        setAppliedJobIds(new Set(candidates.map((c) => c.jobId)));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const syncAppliedJobs = () => {
      if (typeof window === "undefined") return;
      const candidates = getCandidatesFromStorage();
      setAppliedJobIds(new Set(candidates.map((c) => c.jobId)));
    };

    const handleCandidateUpdate = () => {
      syncAppliedJobs();
    };

    window.addEventListener(JOB_CANDIDATE_UPDATED_EVENT, handleCandidateUpdate);
    return () => {
      window.removeEventListener(
        JOB_CANDIDATE_UPDATED_EVENT,
        handleCandidateUpdate
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      const nextMatches = event.matches;
      setIsMobile(nextMatches);
      if (!nextMatches) {
        setIsDetailsModalOpen(false);
      }
    };
    setIsMobile(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedJobId && !jobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(null);
    }
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJob) {
      setIsApplyModalOpen(false);
      setIsDetailsModalOpen(false);
    }
  }, [selectedJob]);

  const hasJobs = jobs.length > 0;
  const isExpanded = Boolean(selectedJob);

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

  const formatDescription = (value?: string) => {
    if (!value) return [];
    return value
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const selectedJobDescriptionItems = useMemo(
    () => formatDescription(selectedJob?.formValues.jobDescription),
    [selectedJob]
  );

  const selectedJobTypeValue = selectedJob?.formValues.jobType?.trim() ?? "";
  const selectedJobTypeLabel =
    JOB_TYPE_LABELS[selectedJobTypeValue] || selectedJobTypeValue;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6 shadow-sm sm:px-12">
        <span className="text-2xl font-semibold">Jobby</span>
        <div className="relative">
          <button
            ref={profileButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
            aria-label="Buka menu profil pengguna"
            aria-expanded={isMenuOpen}
          >
            <FontAwesomeIcon icon={faCircleUser} className="h-6 w-6" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 py-2 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.55)] z-50"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-red-600 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden px-6 py-10 sm:px-12">
        {!hasJobs ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-48 w-48 items-center justify-center rounded-3xl bg-sky-50">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="h-20 w-20 text-sky-500"
              />
            </div>
            <h2 className="mt-10 text-2xl font-semibold text-slate-900">
              No job openings available
            </h2>
            <p className="mt-4 max-w-md text-sm text-slate-500">
              Please check back soon. New opportunities appear here the moment
              Jobby publishes them.
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col md:flex-row md:items-start md:gap-6">
            <section
              className={`transition-all duration-500 ease-in-out ${
                isExpanded ? "md:w-[360px]" : "md:w-full"
              }`}
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Explore open roles
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {jobs.length} active{" "}
                      {jobs.length === 1 ? "role" : "roles"}.
                    </p>
                    <p className="mt-3 hidden text-sm font-medium tracking-wide md:block">
                      Select a job to preview the full description.
                    </p>
                  </div>
                </div>

                <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {jobs.map((job) => {
                    const selected = job.id === selectedJobId;
                    const jobTypeValue = job.formValues.jobType?.trim() ?? "";
                    const jobTypeLabel =
                      JOB_TYPE_LABELS[jobTypeValue] || jobTypeValue;
                    const salaryLabel = buildSalaryLabel(job.formValues);

                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          if (isMobile) {
                            setSelectedJobId(job.id);
                            setIsDetailsModalOpen(true);
                            return;
                          }
                          setSelectedJobId((prev) =>
                            prev === job.id ? null : job.id
                          );
                        }}
                        className={`group relative flex w-full flex-col gap-4 rounded-2xl border px-6 py-5 text-left shadow-sm transition-all duration-500 ease-in-out ${
                          selected
                            ? "border-sky-400 bg-white shadow-[0_25px_60px_-40px_rgba(14,165,233,0.8)]"
                            : "border-slate-300 bg-white hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                        aria-pressed={selected}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                            <FontAwesomeIcon
                              icon={faUserTie}
                              className="h-6 w-6"
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">
                                {job.formValues.jobName?.trim() ||
                                  "Untitled role"}
                              </h3>
                              {appliedJobIds.has(job.id) && (
                                <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                                  APPLIED
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                              Jobby
                            </p>
                          </div>
                        </div>
                        <hr className="border-t border-slate-300" />
                        <div className="flex flex-col gap-2 pl-0">
                          {jobTypeLabel && (
                            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {jobTypeLabel}
                            </span>
                          )}
                          {salaryLabel && (
                            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                              {salaryLabel}
                            </span>
                          )}
                        </div>
                        <span
                          className={`absolute inset-y-2 left-2 w-1 rounded-full transition-opacity duration-500 ${
                            selected ? "bg-sky-400 opacity-100" : "opacity-0"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {selectedJob ? (
              <section className="mt-6 hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 ease-in-out md:block md:flex-1 md:mt-0 md:translate-x-0 md:opacity-100">
                <div className="flex items-start justify-between border-b border-slate-300 px-8 py-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
                      <FontAwesomeIcon icon={faUserTie} className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        {selectedJobTypeValue && (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              JOB_TYPE_BADGE_CLASSES[selectedJobTypeValue] ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {selectedJobTypeLabel}
                          </span>
                        )}
                        {appliedJobIds.has(selectedJob.id) && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                            APPLIED
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                        {selectedJob.formValues.jobName?.trim() ||
                          "Untitled role"}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Jobby
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(true)}
                    disabled={appliedJobIds.has(selectedJob.id)}
                    className="inline-flex items-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-400"
                  >
                    Apply
                  </button>
                </div>

                <div className="grid grid-rows-[1fr]">
                  <div className="max-h-[55vh] overflow-y-auto px-8 py-6 custom-scrollbar">
                    {selectedJobDescriptionItems.length > 0 ? (
                      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                        {selectedJobDescriptionItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        This role does not have a published description yet.
                      </p>
                    )}

                    <div className="mt-8 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                          Job type
                        </p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {selectedJobTypeLabel || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">
                          Salary range
                        </p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {buildSalaryLabel(selectedJob.formValues) ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
      {selectedJob ? (
        <ApplyJobModal
          isOpen={isApplyModalOpen}
          jobId={selectedJob.id}
          jobTitle={selectedJob.formValues.jobName?.trim() ?? null}
          companyName="Jobby"
          job={selectedJob}
          onClose={() => setIsApplyModalOpen(false)}
        />
      ) : null}
      <JobDetailsModal
        isOpen={isDetailsModalOpen && Boolean(selectedJob) && isMobile}
        job={selectedJob}
        onClose={() => {
          setIsDetailsModalOpen(false);
          if (isMobile) {
            setSelectedJobId(null);
          }
        }}
        onApply={() => {
          setIsDetailsModalOpen(false);
          setIsApplyModalOpen(true);
        }}
        isApplied={selectedJob ? appliedJobIds.has(selectedJob.id) : false}
      />
    </div>
  );
}

export default UserDashboard;
