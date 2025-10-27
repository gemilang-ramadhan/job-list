import { useEffect, useMemo, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserTie } from "@fortawesome/free-solid-svg-icons";
import type { StoredJob } from "../types/jobs";

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

type JobDetailsModalProps = {
  isOpen: boolean;
  job: StoredJob | null;
  onClose: () => void;
  onApply: () => void;
  isApplied?: boolean;
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
  return "Not specified";
};

function JobDetailsModal({
  isOpen,
  job,
  onClose,
  onApply,
  isApplied = false,
}: JobDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements =
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
        if (!focusableElements.length) {
          return;
        }
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        )
        ?.focus();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  const descriptionItems = useMemo(() => {
    if (!job?.formValues.jobDescription) return [];
    return job.formValues.jobDescription
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [job]);

  const jobTypeValue = job?.formValues.jobType?.trim() ?? "";
  const jobTypeLabel =
    JOB_TYPE_LABELS[jobTypeValue] || jobTypeValue || "Not specified";

  if (!isOpen || !job) {
    return null;
  }

  const resolvedJobTitle = job.formValues.jobName?.trim() || "Untitled role";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 pb-10 pt-16 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Job details for ${resolvedJobTitle}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="flex h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
              aria-label="Close job details"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Job details
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {resolvedJobTitle}
              </h2>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
            <FontAwesomeIcon icon={faUserTie} className="h-6 w-6" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar-thin">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                JOB_TYPE_BADGE_CLASSES[jobTypeValue] ??
                "bg-slate-100 text-slate-600"
              }`}
            >
              {jobTypeLabel}
            </span>
            {isApplied && (
              <span className="inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                APPLIED
              </span>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Salary range
            </p>
            <p className="mt-2 font-semibold text-slate-700">
              {buildSalaryLabel(job.formValues)}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700">
              Job description
            </p>
            {descriptionItems.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                {descriptionItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                This role does not have a published description yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onApply}
            disabled={isApplied}
            className="inline-flex items-center justify-center rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-400"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobDetailsModal;
