import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import type { StoredJob, FieldRequirement, ProfileField } from "../types/jobs";
import {
  JOB_DRAFT_STORAGE_KEY,
  getDefaultProfileFields,
  parseAllJobs,
} from "../types/jobs";

type JobOpeningModalProps = {
  isOpen: boolean;
  initialDraft?: StoredJob | null;
  onClose: () => void;
  onDraftSaved?: (
    draft: StoredJob,
    options?: { isPublishingNew?: boolean; isActiveUpdate?: boolean }
  ) => void;
  onDraftDeleted?: (draftId: string) => void;
};

type FormSnapshot = {
  jobName: string;
  jobType: string;
  jobDescription: string;
  candidatesNeeded: string;
  minSalary: string;
  maxSalary: string;
  profileRequirements: FieldRequirement[];
};

const readJobsFromStorage = (): StoredJob[] => {
  if (typeof window === "undefined") return [];
  try {
    const storedValue = window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY);
    return parseAllJobs(storedValue);
  } catch (error) {
    console.error("Failed to read drafts from storage", error);
    return [];
  }
};

const writeJobsToStorage = (drafts: StoredJob[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(JOB_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Failed to write drafts to storage", error);
  }
};

function JobOpeningModal({
  isOpen,
  initialDraft = null,
  onClose,
  onDraftSaved,
  onDraftDeleted,
}: JobOpeningModalProps) {
  const [jobName, setJobName] = useState("");
  const [jobType, setJobType] = useState("");
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [candidatesNeeded, setCandidatesNeeded] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const defaultProfileFieldsRef = useRef<ProfileField[]>(
    getDefaultProfileFields()
  );
  const [profileFields, setProfileFields] = useState<ProfileField[]>(() =>
    defaultProfileFieldsRef.current.map((field) => ({ ...field }))
  );
  const snapshotRef = useRef<FormSnapshot>({
    jobName: "",
    jobType: "",
    jobDescription: "",
    candidatesNeeded: "",
    minSalary: "",
    maxSalary: "",
    profileRequirements: defaultProfileFieldsRef.current.map(
      (field) => field.requirement
    ),
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const jobTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const jobTypeOptions = [
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
  ];

  const isEditingExisting = Boolean(initialDraft);
  const isEditingActive = initialDraft?.status === "active";
  const editingDraftId = initialDraft?.id ?? null;

  const generateDraftId = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `job_${year}${month}${day}_${random}`;
  };

  const applyInitialState = (draft: StoredJob | null) => {
    const hydratedProfileFields =
      draft?.profileFields?.length && draft.profileFields
        ? draft.profileFields.map((field) => ({ ...field }))
        : defaultProfileFieldsRef.current.map((field) => ({ ...field }));

    setProfileFields(hydratedProfileFields);
    setJobName(draft?.formValues.jobName ?? "");
    setJobType(draft?.formValues.jobType ?? "");
    setJobDescription(draft?.formValues.jobDescription ?? "");
    setCandidatesNeeded(draft?.formValues.candidatesNeeded ?? "");
    setMinSalary(draft?.formValues.minSalary ?? "");
    setMaxSalary(draft?.formValues.maxSalary ?? "");
    setIsJobTypeOpen(false);

    snapshotRef.current = {
      jobName: (draft?.formValues.jobName ?? "").trim(),
      jobType: (draft?.formValues.jobType ?? "").trim(),
      jobDescription: (draft?.formValues.jobDescription ?? "").trim(),
      candidatesNeeded: (draft?.formValues.candidatesNeeded ?? "").trim(),
      minSalary: (draft?.formValues.minSalary ?? "").trim(),
      maxSalary: (draft?.formValues.maxSalary ?? "").trim(),
      profileRequirements: hydratedProfileFields.map(
        (field) => field.requirement
      ),
    };
  };

  const currentSnapshot: FormSnapshot = {
    jobName: jobName.trim(),
    jobType: jobType.trim(),
    jobDescription: jobDescription.trim(),
    candidatesNeeded: candidatesNeeded.trim(),
    minSalary: minSalary.trim(),
    maxSalary: maxSalary.trim(),
    profileRequirements: profileFields.map((field) => field.requirement),
  };

  const hasUnsavedChanges = (() => {
    const initial = snapshotRef.current;
    if (!initial) return false;

    if (
      initial.jobName !== currentSnapshot.jobName ||
      initial.jobType !== currentSnapshot.jobType ||
      initial.jobDescription !== currentSnapshot.jobDescription ||
      initial.candidatesNeeded !== currentSnapshot.candidatesNeeded ||
      initial.minSalary !== currentSnapshot.minSalary ||
      initial.maxSalary !== currentSnapshot.maxSalary
    ) {
      return true;
    }

    if (
      initial.profileRequirements.length !==
      currentSnapshot.profileRequirements.length
    ) {
      return true;
    }

    return initial.profileRequirements.some(
      (requirement, index) =>
        requirement !== currentSnapshot.profileRequirements[index]
    );
  })();

  const buildDraftFormValues = (): StoredJob["formValues"] => {
    const values: StoredJob["formValues"] = {};
    if (currentSnapshot.jobName) values.jobName = currentSnapshot.jobName;
    if (currentSnapshot.jobType) values.jobType = currentSnapshot.jobType;
    if (currentSnapshot.jobDescription)
      values.jobDescription = currentSnapshot.jobDescription;
    if (currentSnapshot.candidatesNeeded)
      values.candidatesNeeded = currentSnapshot.candidatesNeeded;
    if (currentSnapshot.minSalary) values.minSalary = currentSnapshot.minSalary;
    if (currentSnapshot.maxSalary) values.maxSalary = currentSnapshot.maxSalary;
    return values;
  };

  const upsertJobInStorage = (draft: StoredJob) => {
    const existingDrafts = readJobsFromStorage();
    const filtered = existingDrafts.filter((item) => item.id !== draft.id);
    writeJobsToStorage([draft, ...filtered]);
  };

  const removeJobFromStorage = (draftId: string) => {
    const existingDrafts = readJobsFromStorage();
    const filtered = existingDrafts.filter((item) => item.id !== draftId);
    writeJobsToStorage(filtered);
  };

  const handleRequestClose = () => {
    if (hasUnsavedChanges) {
      setIsConfirmModalOpen(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setIsConfirmModalOpen(false);
    applyInitialState(initialDraft ?? null);
    onClose();
  };

  const persistJob = (
    status: StoredJob["status"],
    options?: {
      onDraftSavedOptions?: {
        isPublishingNew?: boolean;
        isActiveUpdate?: boolean;
      };
    }
  ) => {
    const now = new Date();
    const draftId = editingDraftId ?? generateDraftId(now);
    const job: StoredJob = {
      id: draftId,
      status,
      savedAt: now.toISOString(),
      publishedAt:
        status === "active"
          ? initialDraft?.publishedAt ?? now.toISOString()
          : undefined,
      formValues: buildDraftFormValues(),
      profileFields: profileFields.map((field) => ({ ...field })),
    };

    upsertJobInStorage(job);
    snapshotRef.current = {
      ...currentSnapshot,
      profileRequirements: [...currentSnapshot.profileRequirements],
    };
    onDraftSaved?.(job, options?.onDraftSavedOptions);
    return job;
  };

  const handleConfirmSave = () => {
    const status = initialDraft?.status ?? "draft";
    persistJob(status, {
      onDraftSavedOptions:
        status === "active" && isFormComplete
          ? { isActiveUpdate: true }
          : undefined,
    });
    setIsConfirmModalOpen(false);
    onClose();
  };

  const handleSaveDraftClick = () => {
    persistJob("draft");
    onClose();
  };

  const handleSaveAsDraftClick = () => {
    persistJob("draft");
    onClose();
  };

  const handlePublishJobClick = () => {
    if (!isFormComplete) return;
    persistJob("active", {
      onDraftSavedOptions: { isPublishingNew: true },
    });
    onClose();
  };

  const handleSaveActiveChangesClick = () => {
    if (!isFormComplete) return;
    persistJob("active", {
      onDraftSavedOptions: { isActiveUpdate: true },
    });
    onClose();
  };

  const handleDeleteDraftClick = () => {
    if (!editingDraftId) return;
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!editingDraftId) return;
    removeJobFromStorage(editingDraftId);
    onDraftDeleted?.(editingDraftId);
    setIsDeleteConfirmOpen(false);
    setIsConfirmModalOpen(false);
    applyInitialState(null);
    onClose();
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      applyInitialState(initialDraft ?? null);
      setIsConfirmModalOpen(false);
      setIsDeleteConfirmOpen(false);
    } else {
      document.body.style.overflow = "";
      setIsJobTypeOpen(false);
      setIsConfirmModalOpen(false);
      setIsDeleteConfirmOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialDraft]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      if (isConfirmModalOpen || isDeleteConfirmOpen) return;
      handleRequestClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        jobTypeDropdownRef.current &&
        !jobTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsJobTypeOpen(false);
      }
    };

    if (isJobTypeOpen) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [isJobTypeOpen]);

  const handleRequirementChange = (
    key: string,
    requirement: FieldRequirement
  ) => {
    setProfileFields((prev) =>
      prev.map((field) =>
        field.key === key ? { ...field, requirement } : field
      )
    );
  };

  const getRequirementButtonClasses = (
    currentRequirement: FieldRequirement,
    buttonRequirement: FieldRequirement,
    { disabled = false }: { disabled?: boolean } = {}
  ) =>
    `rounded-full px-4 py-1.5 text-xs font-medium transition ${
      disabled
        ? "cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-100"
        : currentRequirement === buttonRequirement
        ? "bg-sky-500 text-white"
        : buttonRequirement === "Optional" || buttonRequirement === "Off"
        ? "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
        : "bg-white text-slate-600 hover:bg-slate-100"
    }`;

  const lockedMandatoryFields = new Set([
    "full_name",
    "photo_profile",
    "email",
  ]);

  const isFormComplete =
    jobName.trim() !== "" &&
    jobType.trim() !== "" &&
    jobDescription.trim() !== "" &&
    candidatesNeeded.trim() !== "" &&
    minSalary.trim() !== "" &&
    maxSalary.trim() !== "";

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numericValue));
  };

  const handleMinSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setMinSalary(formatted);
  };

  const handleMaxSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setMaxSalary(formatted);
  };

  const renderActionButtons = () => {
    if (isEditingExisting) {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handleDeleteDraftClick}
            className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200 sm:w-auto"
          >
            {isEditingActive ? "Delete Job" : "Delete Draft"}
          </button>
          <button
            type="button"
            onClick={
              isEditingActive ? handleSaveAsDraftClick : handleSaveDraftClick
            }
            className="w-full rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-800 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-auto"
          >
            {isEditingActive ? "Save As Draft" : "Save Draft"}
          </button>
          {isEditingActive ? (
            <button
              type="button"
              disabled={!isFormComplete}
              onClick={handleSaveActiveChangesClick}
              className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:min-w-[180px] ${
                isFormComplete
                  ? "bg-sky-500 text-white shadow hover:bg-sky-600 focus-visible:outline-sky-500"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 focus-visible:outline-slate-300"
              }`}
            >
              Save Changes
            </button>
          ) : (
            <button
              type="button"
              disabled={!isFormComplete}
              onClick={handlePublishJobClick}
              className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:min-w-[180px] ${
                isFormComplete
                  ? "bg-sky-500 text-white shadow hover:bg-sky-600 focus-visible:outline-sky-500"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 focus-visible:outline-slate-300"
              }`}
            >
              Publish Job
            </button>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        disabled={!isFormComplete}
        onClick={handlePublishJobClick}
        className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isFormComplete
            ? "bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline-sky-500"
            : "cursor-not-allowed bg-slate-200 text-slate-400 focus-visible:outline-slate-300"
        }`}
      >
        Publish Job
      </button>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditingExisting ? "Manage Job" : "Job Opening"}
          </h2>
          <button
            type="button"
            onClick={handleRequestClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-200px)] overflow-y-auto custom-scrollbar px-8 py-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="jobName"
                className="mb-2 block text-sm text-slate-700"
              >
                Job Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Ex. Front End Engineer"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div className="relative" ref={jobTypeDropdownRef}>
              <label className="mb-2 block text-sm text-slate-700">
                Job Type<span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsJobTypeOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <span>
                  {jobType
                    ? jobTypeOptions.find((option) => option.value === jobType)
                        ?.label
                    : "Select job type"}
                </span>
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    isJobTypeOpen ? "rotate-180" : "rotate-0"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isJobTypeOpen && (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <ul className="max-h-52 overflow-y-auto">
                    {jobTypeOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => {
                            setJobType(option.value);
                            setIsJobTypeOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                            jobType === option.value
                              ? "bg-sky-50 text-slate-900"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {jobType === option.value && (
                            <span className="text-xs font-semibold text-sky-500">
                              Selected
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="jobDescription"
                className="mb-2 block text-sm text-slate-700"
              >
                Job Description<span className="text-red-500">*</span>
              </label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Ex."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div>
              <label
                htmlFor="candidatesNeeded"
                className="mb-2 block text-sm text-slate-700"
              >
                Number of Candidate Needed
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="candidatesNeeded"
                value={candidatesNeeded}
                onChange={(e) => setCandidatesNeeded(e.target.value)}
                placeholder="Ex. 2"
                min="1"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm text-slate-700">
                Job Salary
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="minSalary"
                    className="mb-2 block text-xs text-slate-600"
                  >
                    Minimum Estimated Salary
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-600">
                      Rp
                    </span>
                    <input
                      type="text"
                      id="minSalary"
                      value={minSalary}
                      onChange={handleMinSalaryChange}
                      placeholder="7.000.000"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="maxSalary"
                    className="mb-2 block text-xs text-slate-600"
                  >
                    Maximum Estimated Salary
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-600">
                      Rp
                    </span>
                    <input
                      type="text"
                      id="maxSalary"
                      value={maxSalary}
                      onChange={handleMaxSalaryChange}
                      placeholder="8.000.000"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium text-slate-700">
                Minimum Profile Information Required
              </h3>
              <div className="space-y-3">
                {profileFields.map((field) => {
                  const isLockedField = lockedMandatoryFields.has(field.key);

                  return (
                    <div
                      key={field.key}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm text-slate-700">
                        {field.label}
                      </span>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleRequirementChange(field.key, "Mandatory")
                          }
                          className={getRequirementButtonClasses(
                            field.requirement,
                            "Mandatory"
                          )}
                        >
                          Mandatory
                        </button>
                        <button
                          type="button"
                          disabled={isLockedField}
                          onClick={() =>
                            handleRequirementChange(field.key, "Optional")
                          }
                          className={getRequirementButtonClasses(
                            field.requirement,
                            "Optional",
                            { disabled: isLockedField }
                          )}
                          aria-disabled={isLockedField}
                        >
                          Optional
                        </button>
                        <button
                          type="button"
                          disabled={isLockedField}
                          onClick={() =>
                            handleRequirementChange(field.key, "Off")
                          }
                          className={getRequirementButtonClasses(
                            field.requirement,
                            "Off",
                            { disabled: isLockedField }
                          )}
                          aria-disabled={isLockedField}
                        >
                          Off
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-6 sm:hidden">
            {renderActionButtons()}
          </div>
        </div>

        <div className="border-t border-slate-100 px-8 py-6 hidden sm:block">
          {renderActionButtons()}
        </div>
      </div>

      {isConfirmModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
          onClick={handleConfirmDiscard}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] transition-all duration-500 ease-in-out"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Save Draft
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Do you want to save this as a draft?
              </p>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
          onClick={handleCancelDelete}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)] transition-all duration-500 ease-in-out"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {isEditingActive ? "Delete Job" : "Delete Draft"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {isEditingActive
                  ? "This job will be removed permanently. Are you sure you want to continue?"
                  : "This draft will be removed permanently. Are you sure you want to continue?"}
              </p>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
              >
                {isEditingActive ? "No, keep job" : "No, keep draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobOpeningModal;
