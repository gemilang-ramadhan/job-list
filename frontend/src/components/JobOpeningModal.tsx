import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";

type JobOpeningModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FieldRequirement = "Mandatory" | "Optional" | "Off";

type ProfileField = {
  key: string;
  label: string;
  requirement: FieldRequirement;
};

function JobOpeningModal({ isOpen, onClose }: JobOpeningModalProps) {
  const [jobName, setJobName] = useState("");
  const [jobType, setJobType] = useState("");
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [candidatesNeeded, setCandidatesNeeded] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  const [profileFields, setProfileFields] = useState<ProfileField[]>([
    { key: "full_name", label: "Full name", requirement: "Mandatory" },
    { key: "photo_profile", label: "Photo Profile", requirement: "Mandatory" },
    { key: "gender", label: "Gender", requirement: "Mandatory" },
    { key: "domicile", label: "Domicile", requirement: "Mandatory" },
    { key: "email", label: "Email", requirement: "Mandatory" },
    { key: "phone_number", label: "Phone number", requirement: "Mandatory" },
    { key: "linkedin_link", label: "LinkedIn link", requirement: "Mandatory" },
    { key: "date_of_birth", label: "Date of birth", requirement: "Mandatory" },
  ]);
  const jobTypeOptions = [
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
  ];
  const jobTypeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsJobTypeOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
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
        : // For Optional and Off provide a slightly more defined border when not active
        buttonRequirement === "Optional" || buttonRequirement === "Off"
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <h2 className="text-xl font-semibold text-slate-900">Job Opening</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar px-8 py-6">
          <div className="space-y-6">
            {/* Job Name */}
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

            {/* Job Type */}
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

            {/* Job Description */}
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

            {/* Number of Candidate Needed */}
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

            {/* Job Salary */}
            <div>
              <label className="mb-3 block text-sm text-slate-700">
                Job Salary
              </label>
              <div className="grid grid-cols-2 gap-4">
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

            {/* Minimum Profile Information Required */}
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
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-8 py-6">
          <button
            type="button"
            disabled={!isFormComplete}
            className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isFormComplete
                ? "bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline-sky-500"
                : "cursor-not-allowed bg-slate-200 text-slate-400 focus-visible:outline-slate-300"
            }`}
          >
            Publish Job
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobOpeningModal;
