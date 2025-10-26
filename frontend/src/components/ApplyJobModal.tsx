import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCamera,
  faCircleInfo,
  faCircleUser,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

type ApplyJobModalProps = {
  isOpen: boolean;
  jobTitle?: string | null;
  companyName?: string;
  onClose: () => void;
};

type ApplyFormState = {
  fullName: string;
  dateOfBirth: string;
  pronoun: "she-her" | "he-him" | "";
  domicile: string;
  phoneNumber: string;
  email: string;
  linkedin: string;
};

const initialFormState: ApplyFormState = {
  fullName: "",
  dateOfBirth: "",
  pronoun: "",
  domicile: "",
  phoneNumber: "",
  email: "",
  linkedin: "",
};

const COUNTRY_OPTIONS = [
  { id: "ID", label: "Indonesia", dialCode: "+62" },
  { id: "US", label: "United States", dialCode: "+1" },
  { id: "SG", label: "Singapore", dialCode: "+65" },
  { id: "MY", label: "Malaysia", dialCode: "+60" },
  { id: "AU", label: "Australia", dialCode: "+61" },
  { id: "JP", label: "Japan", dialCode: "+81" },
  { id: "IN", label: "India", dialCode: "+91" },
];

function ApplyJobModal({
  isOpen,
  jobTitle,
  companyName = "Jobby",
  onClose,
}: ApplyJobModalProps) {
  const [formState, setFormState] = useState<ApplyFormState>(initialFormState);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
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
    if (isOpen) {
      setFormState(initialFormState);
      setSelectedCountry(COUNTRY_OPTIONS[0]);
      setIsCountryDropdownOpen(false);
      setTimeout(() => {
        dialogRef.current?.querySelector<HTMLElement>("input, button")?.focus();
      }, 0);
    } else {
      setIsCountryDropdownOpen(false);
    }
  }, [isOpen]);

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const isFormComplete = useMemo(() => {
    return (
      formState.fullName.trim() !== "" &&
      formState.dateOfBirth.trim() !== "" &&
      formState.pronoun.trim() !== "" &&
      formState.domicile.trim() !== "" &&
      formState.phoneNumber.trim() !== "" &&
      formState.email.trim() !== "" &&
      formState.linkedin.trim() !== ""
    );
  }, [formState]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormComplete) return;
    // Placeholder: integrate with backend/submission flow later.
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCountryDropdownOpen &&
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isCountryDropdownOpen]);

  if (!isOpen) {
    return null;
  }

  const resolvedJobTitle = (jobTitle ?? "").trim() || "Untitled role";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Apply to ${resolvedJobTitle}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-[0_40px_90px_-60px_rgba(15,23,42,0.55)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
              aria-label="Close application form"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Apply {resolvedJobTitle} at {companyName}
              </h2>
              <p className="mt-1 text-xs font-medium text-rose-500">
                * Required
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4" />
            <span>This field required to fill</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex max-h-[75vh] flex-1 flex-col overflow-hidden"
        >
          <div className="custom-scrollbar flex-1 overflow-y-auto px-8 py-6">
            <section className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Photo Profile
                </p>
                <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-6 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-500">
                    <FontAwesomeIcon
                      icon={faCircleUser}
                      className="h-12 w-12"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 items-center md:items-start">
                    <p className="text-sm text-slate-500">
                      Take a photo that clearly shows your face.
                    </p>
                    <button
                      type="button"
                      className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
                    >
                      <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                      Take a Picture
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <label className="block text-sm font-medium text-slate-700">
                  Full name<span className="text-rose-500">*</span>
                  <input
                    type="text"
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Date of birth<span className="text-rose-500">*</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formState.dateOfBirth}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <fieldset className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <legend className="px-1 text-sm font-medium text-slate-700">
                    Pronoun (gender)<span className="text-rose-500">*</span>
                  </legend>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="radio"
                        name="pronoun"
                        value="she-her"
                        checked={formState.pronoun === "she-her"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-slate-300 text-sky-500 focus:ring-sky-200"
                      />
                      She/her (Female)
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="radio"
                        name="pronoun"
                        value="he-him"
                        checked={formState.pronoun === "he-him"}
                        onChange={handleInputChange}
                        className="h-4 w-4 border-slate-300 text-sky-500 focus:ring-sky-200"
                      />
                      He/him (Male)
                    </label>
                  </div>
                </fieldset>

                <label className="block text-sm font-medium text-slate-700">
                  Domicile<span className="text-rose-500">*</span>
                  <input
                    type="text"
                    name="domicile"
                    value={formState.domicile}
                    onChange={handleInputChange}
                    placeholder="Enter your domicile"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Phone number<span className="text-rose-500">*</span>
                  <div
                    ref={countryDropdownRef}
                    className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsCountryDropdownOpen((previous) => !previous)
                        }
                        className="inline-flex items-center gap-2 text-sm text-slate-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:rounded-md pr-3 border-r border-slate-200 cursor-pointer"
                        aria-haspopup="listbox"
                        aria-expanded={isCountryDropdownOpen}
                        aria-label="Select country code"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-700">
                          {selectedCountry.id}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {selectedCountry.dialCode}
                        </span>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className="ml-1 h-3 w-3 text-slate-400"
                        />
                      </button>
                      {isCountryDropdownOpen && (
                        <ul
                          className="absolute left-0 top-full z-10 mt-2 max-h-60 w-52 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] custom-scrollbar"
                          role="listbox"
                        >
                          {COUNTRY_OPTIONS.map((country) => (
                            <li key={country.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setIsCountryDropdownOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                                  selectedCountry.id === country.id
                                    ? "bg-sky-50 text-slate-900"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                                role="option"
                                aria-selected={
                                  selectedCountry.id === country.id
                                }
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-700">
                                  {country.id}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold">
                                    {country.label}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {country.dialCode}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formState.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="81212345678"
                      className="h-10 flex-1 border-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Email<span className="text-rose-500">*</span>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Link LinkedIn<span className="text-rose-500">*</span>
                  <input
                    type="url"
                    name="linkedin"
                    value={formState.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/username"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="border-t border-slate-100 bg-white px-8 py-4">
            <button
              type="submit"
              disabled={!isFormComplete}
              className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isFormComplete
                  ? "bg-sky-500 text-white shadow hover:bg-sky-600 focus-visible:outline-sky-500"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 focus-visible:outline-slate-300"
              }`}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyJobModal;
