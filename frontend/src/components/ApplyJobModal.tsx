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
  faChevronLeft,
  faChevronRight,
  faTimes,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { Hands } from "@mediapipe/hands";
import {
  appendCandidateToStorage,
  createCandidateId,
  JOB_CANDIDATE_UPDATED_EVENT,
  type CandidateAttribute,
  type StoredCandidate,
} from "../types/candidates";
import type { StoredJob } from "../types/jobs";

type ApplyJobModalProps = {
  isOpen: boolean;
  jobId: string;
  jobTitle?: string | null;
  companyName?: string;
  job?: StoredJob | null;
  onClose: () => void;
};

type ApplyFormState = {
  fullName: string;
  dateOfBirth: string;
  pronoun: "she-her" | "he-him" | "";
  phoneNumber: string;
  email: string;
  linkedin: string;
  photoProfile: string;
};

type FormErrors = {
  fullName: string;
  dateOfBirth: string;
  pronoun: string;
  phoneNumber: string;
  email: string;
  linkedin: string;
  photoProfile: string;
  domicile: string;
};

const initialFormState: ApplyFormState = {
  fullName: "",
  dateOfBirth: "",
  pronoun: "",
  phoneNumber: "",
  email: "",
  linkedin: "",
  photoProfile: "",
};

const initialFormErrors: FormErrors = {
  fullName: "",
  dateOfBirth: "",
  pronoun: "",
  phoneNumber: "",
  email: "",
  linkedin: "",
  photoProfile: "",
  domicile: "",
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

const DOMICILE_OPTIONS = [
  { id: "", label: "Select your domicile" },
  { id: "aceh", label: "Aceh" },
  { id: "north-sumatra", label: "North Sumatra" },
  { id: "west-sumatra", label: "West Sumatra" },
  { id: "riau", label: "Riau" },
  { id: "jambi", label: "Jambi" },
  { id: "south-sumatra", label: "South Sumatra" },
  { id: "bengkulu", label: "Bengkulu" },
  { id: "lampung", label: "Lampung" },
  { id: "bangka-belitung", label: "Bangka Belitung Islands" },
  { id: "riau-islands", label: "Riau Islands" },
  { id: "jakarta", label: "Special Capital Region of Jakarta" },
  { id: "west-java", label: "West Java" },
  { id: "central-java", label: "Central Java" },
  { id: "yogyakarta", label: "Special Region of Yogyakarta" },
  { id: "east-java", label: "East Java" },
  { id: "banten", label: "Banten" },
  { id: "bali", label: "Bali" },
  { id: "west-nusa-tenggara", label: "West Nusa Tenggara" },
  { id: "east-nusa-tenggara", label: "East Nusa Tenggara" },
  { id: "west-kalimantan", label: "West Kalimantan" },
  { id: "central-kalimantan", label: "Central Kalimantan" },
  { id: "south-kalimantan", label: "South Kalimantan" },
  { id: "east-kalimantan", label: "East Kalimantan" },
  { id: "north-kalimantan", label: "North Kalimantan" },
  { id: "north-sulawesi", label: "North Sulawesi" },
  { id: "central-sulawesi", label: "Central Sulawesi" },
  { id: "south-sulawesi", label: "South Sulawesi" },
  { id: "southeast-sulawesi", label: "Southeast Sulawesi" },
  { id: "gorontalo", label: "Gorontalo" },
  { id: "west-sulawesi", label: "West Sulawesi" },
  { id: "maluku", label: "Maluku" },
  { id: "north-maluku", label: "North Maluku" },
  { id: "papua", label: "Papua" },
  { id: "west-papua", label: "West Papua" },
  { id: "south-papua", label: "South Papua" },
  { id: "central-papua", label: "Central Papua" },
  { id: "highland-papua", label: "Highland Papua" },
  { id: "southwest-papua", label: "Southwest Papua" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const MIN_YEAR = 1980;
const MAX_YEAR = 2025;
const YEAR_RANGE = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, index) => MIN_YEAR + index
);

type DobPickerMode = "day" | "month" | "year";

type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

type HandDetectionResult = {
  multiHandLandmarks?: NormalizedLandmark[][];
  multiHandedness?: Array<{ label?: string; score?: number }>;
};

const HOLD_FRAMES_REQUIRED = 12;
const COUNTDOWN_START_VALUE = 3;

const POSE_SEQUENCE = [
  {
    id: "pose-1" as const,
    title: "Pose 1",
    fingerCount: 1,
    prompt: "Raise one finger and keep your hand inside the frame.",
  },
  {
    id: "pose-2" as const,
    title: "Pose 2",
    fingerCount: 2,
    prompt: "Great! Now raise two fingers while keeping your palm visible.",
  },
  {
    id: "pose-3" as const,
    title: "Pose 3",
    fingerCount: 3,
    prompt: "Almost done. Raise three fingers to start the countdown.",
  },
] as const;

function ApplyJobModal({
  isOpen,
  jobId,
  jobTitle,
  companyName = "Jobby",
  job,
  onClose,
}: ApplyJobModalProps) {
  const [formState, setFormState] = useState<ApplyFormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>(initialFormErrors);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedDomicile, setSelectedDomicile] = useState(DOMICILE_OPTIONS[0]);
  const [isDomicileDropdownOpen, setIsDomicileDropdownOpen] = useState(false);
  const [isDobPickerOpen, setIsDobPickerOpen] = useState(false);
  const [dobPickerMode, setDobPickerMode] = useState<DobPickerMode>("day");
  const [dobViewDate, setDobViewDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 21);
    defaultDate.setHours(0, 0, 0, 0);
    return defaultDate;
  });
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const domicileDropdownRef = useRef<HTMLDivElement | null>(null);
  const dobPickerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsInstanceRef = useRef<Hands | null>(null);
  const detectionRafRef = useRef<number | null>(null);
  const countdownTimeoutRef = useRef<number | null>(null);
  const isProcessingFrameRef = useRef(false);
  const poseHoldFrameRef = useRef(0);
  const detectionActiveRef = useRef(false);
  const poseIndexRef = useRef(0);
  const feedbackRef = useRef<string>(POSE_SEQUENCE[0].prompt);
  const poseProgressRef = useRef(0);
  const countdownRunningRef = useRef(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [poseIndex, setPoseIndex] = useState(0);
  const [poseFeedback, setPoseFeedback] = useState<string>(
    POSE_SEQUENCE[0].prompt
  );
  const [poseProgress, setPoseProgress] = useState(0);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);

  useEffect(() => {
    poseIndexRef.current = poseIndex;
  }, [poseIndex]);

  useEffect(() => {
    feedbackRef.current = poseFeedback;
  }, [poseFeedback]);

  useEffect(() => {
    poseProgressRef.current = poseProgress;
  }, [poseProgress]);

  useEffect(() => {
    countdownRunningRef.current = isCountdownRunning;
  }, [isCountdownRunning]);

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
      setFormErrors(initialFormErrors);
      setSelectedCountry(COUNTRY_OPTIONS[0]);
      setCountrySearch("");
      setSelectedDomicile(DOMICILE_OPTIONS[0]);
      setIsCountryDropdownOpen(false);
      setIsDomicileDropdownOpen(false);
      setIsDobPickerOpen(false);
      setDobPickerMode("day");
      setPoseIndex(0);
      setPoseFeedback(POSE_SEQUENCE[0].prompt);
      setPoseProgress(0);
      setCountdownValue(null);
      setIsCountdownRunning(false);
      setCameraError(null);
      setDobViewDate(() => {
        const baseline = new Date();
        baseline.setFullYear(baseline.getFullYear() - 21);
        baseline.setHours(0, 0, 0, 0);
        return baseline;
      });
      setTimeout(() => {
        dialogRef.current?.querySelector<HTMLElement>("input, button")?.focus();
      }, 0);
    } else {
      setIsCountryDropdownOpen(false);
      setCountrySearch("");
      setIsDomicileDropdownOpen(false);
      setIsDobPickerOpen(false);
      setDobPickerMode("day");
      setCapturedPhoto(null);
      setIsCameraOpen(false);
      stopCamera();
      setCameraError(null);
      setPoseIndex(0);
      setPoseFeedback(POSE_SEQUENCE[0].prompt);
      setPoseProgress(0);
      setCountdownValue(null);
      setIsCountdownRunning(false);
    }
  }, [isOpen]);

  const stripCountryCode = (phoneValue: string): string => {
    // Remove all whitespace first
    const cleaned = phoneValue.replace(/\s+/g, "");

    // Check if it starts with + and extract potential country code
    if (cleaned.startsWith("+")) {
      // Try to match against all available country dial codes
      for (const country of COUNTRY_OPTIONS) {
        const dialCode = country.dialCode.replace("+", "");
        if (cleaned.startsWith(`+${dialCode}`)) {
          // Return the phone number without the country code
          return cleaned.substring(dialCode.length + 1); // +1 for the '+'
        }
      }
    }

    return phoneValue;
  };

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    // Clear error for this field when user starts typing
    if (name in formErrors) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Strip country code from phone number input
    if (name === "phoneNumber") {
      const strippedValue = stripCountryCode(value);
      setFormState((prev) => ({ ...prev, [name]: strippedValue }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const profileFields = job?.profileFields ?? [];

  const isFieldRequired = (fieldKey: string) => {
    const field = profileFields.find((f) => f.key === fieldKey);
    return field?.requirement === "Mandatory";
  };

  const isFieldVisible = (fieldKey: string) => {
    const field = profileFields.find((f) => f.key === fieldKey);
    return field?.requirement !== "Off";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Validate all required fields and collect errors
    const errors: FormErrors = {
      fullName: "",
      dateOfBirth: "",
      pronoun: "",
      phoneNumber: "",
      email: "",
      linkedin: "",
      photoProfile: "",
      domicile: "",
    };

    if (isFieldRequired("full_name") && formState.fullName.trim() === "") {
      errors.fullName = "Nama lengkap tidak boleh kosong";
    }
    if (
      isFieldRequired("photo_profile") &&
      formState.photoProfile.trim() === ""
    ) {
      errors.photoProfile = "Foto profil tidak boleh kosong";
    }
    if (
      isFieldRequired("date_of_birth") &&
      formState.dateOfBirth.trim() === ""
    ) {
      errors.dateOfBirth = "Tanggal lahir tidak boleh kosong";
    }
    if (isFieldRequired("gender") && formState.pronoun.trim() === "") {
      errors.pronoun = "Jenis kelamin tidak boleh kosong";
    }
    if (isFieldRequired("domicile") && selectedDomicile.id === "") {
      errors.domicile = "Domisili tidak boleh kosong";
    }
    if (
      isFieldRequired("phone_number") &&
      formState.phoneNumber.trim() === ""
    ) {
      errors.phoneNumber = "Nomor telepon tidak boleh kosong";
    }
    if (isFieldRequired("email") && formState.email.trim() === "") {
      errors.email = "Alamat email tidak boleh kosong";
    }
    if (isFieldRequired("linkedin_link") && formState.linkedin.trim() === "") {
      errors.linkedin = "Link LinkedIn tidak boleh kosong";
    }

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    const normalizedJobId = jobId.trim();
    if (!normalizedJobId) return;

    const submissionDate = new Date();
    const dobDate = new Date(`${formState.dateOfBirth}T00:00:00`);
    const formattedDob = Number.isNaN(dobDate.getTime())
      ? formState.dateOfBirth
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(dobDate);
    const genderLabel =
      formState.pronoun === "she-her"
        ? "Female"
        : formState.pronoun === "he-him"
        ? "Male"
        : "Not specified";
    const phoneLabel = `${selectedCountry.dialCode} ${
      formState.phoneNumber.trim() || ""
    }`.trim();

    const candidateAttributes: CandidateAttribute[] = [
      {
        key: "full_name",
        label: "Full Name",
        value: formState.fullName.trim(),
        order: 1,
      },
      {
        key: "email",
        label: "Email",
        value: formState.email.trim(),
        order: 2,
      },
      {
        key: "phone",
        label: "Phone",
        value: phoneLabel,
        order: 3,
      },
      {
        key: "date_of_birth",
        label: "Date of Birth",
        value: formattedDob,
        order: 4,
      },
      {
        key: "domicile",
        label: "Domicile",
        value: selectedDomicile.label,
        order: 5,
      },
      {
        key: "gender",
        label: "Gender",
        value: genderLabel,
        order: 6,
      },
      {
        key: "linkedin_link",
        label: "LinkedIn",
        value: formState.linkedin.trim(),
        order: 7,
      },
    ];

    const storedCandidate: StoredCandidate = {
      id: createCandidateId(submissionDate),
      jobId: normalizedJobId,
      submittedAt: submissionDate.toISOString(),
      attributes: candidateAttributes,
    };

    appendCandidateToStorage(storedCandidate);
    window.dispatchEvent(
      new CustomEvent(JOB_CANDIDATE_UPDATED_EVENT, {
        detail: { jobId: normalizedJobId },
      })
    );
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
        setCountrySearch("");
      }
      if (
        isDomicileDropdownOpen &&
        domicileDropdownRef.current &&
        !domicileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDomicileDropdownOpen(false);
      }
      if (
        isDobPickerOpen &&
        dobPickerRef.current &&
        !dobPickerRef.current.contains(event.target as Node)
      ) {
        setIsDobPickerOpen(false);
        setDobPickerMode("day");
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isCountryDropdownOpen, isDomicileDropdownOpen, isDobPickerOpen]);

  const resolvedJobTitle = (jobTitle ?? "").trim() || "Untitled role";
  const selectedDate = formState.dateOfBirth
    ? new Date(`${formState.dateOfBirth}T00:00:00`)
    : null;
  const dobDisplayLabel = selectedDate
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(selectedDate)
    : "Select your birth date";

  const now = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const minSelectableDate = useMemo(() => {
    const minDate = new Date(MIN_YEAR, 0, 1);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  }, []);

  const visibleMonthName = useMemo(() => {
    return MONTH_LABELS[dobViewDate.getMonth()];
  }, [dobViewDate]);

  const visibleYear = dobViewDate.getFullYear();

  const filteredCountryOptions = useMemo(() => {
    const term = countrySearch.trim().toLowerCase();
    if (!term) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((country) => {
      return (
        country.label.toLowerCase().includes(term) ||
        country.id.toLowerCase().includes(term) ||
        country.dialCode.toLowerCase().includes(term)
      );
    });
  }, [countrySearch]);

  const calendarDays = useMemo(() => {
    const startOfMonth = new Date(
      dobViewDate.getFullYear(),
      dobViewDate.getMonth(),
      1
    );
    const startOffset = startOfMonth.getDay();
    const firstVisibleDate = new Date(startOfMonth);
    firstVisibleDate.setDate(firstVisibleDate.getDate() - startOffset);

    const totalCells = 42; // 6 rows to avoid layout shift
    const days: Date[] = [];
    for (let index = 0; index < totalCells; index += 1) {
      const cellDate = new Date(firstVisibleDate);
      cellDate.setDate(firstVisibleDate.getDate() + index);
      cellDate.setHours(0, 0, 0, 0);
      days.push(cellDate);
    }

    return days;
  }, [dobViewDate]);

  const yearGrid = useMemo(() => {
    const segmentSize = 12;
    if (YEAR_RANGE.length <= segmentSize) {
      return {
        years: YEAR_RANGE,
        start: YEAR_RANGE[0],
        end: YEAR_RANGE[YEAR_RANGE.length - 1],
      };
    }

    const relativeIndex = Math.floor(
      (dobViewDate.getFullYear() - YEAR_RANGE[0]) / segmentSize
    );
    const startIndex = Math.min(
      Math.max(relativeIndex * segmentSize, 0),
      YEAR_RANGE.length - segmentSize
    );
    const years = YEAR_RANGE.slice(startIndex, startIndex + segmentSize);
    return {
      years,
      start: years[0],
      end: years[years.length - 1],
    };
  }, [dobViewDate]);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const disablePrev = useMemo(() => {
    if (dobPickerMode === "day") {
      const previousMonth = new Date(
        dobViewDate.getFullYear(),
        dobViewDate.getMonth(),
        0
      );
      previousMonth.setHours(0, 0, 0, 0);
      return previousMonth < minSelectableDate;
    }
    if (dobPickerMode === "month") {
      const previousYear = new Date(
        dobViewDate.getFullYear() - 1,
        dobViewDate.getMonth(),
        1
      );
      previousYear.setHours(0, 0, 0, 0);
      return previousYear < minSelectableDate;
    }
    return yearGrid.start <= YEAR_RANGE[0];
  }, [dobPickerMode, dobViewDate, minSelectableDate, yearGrid.start]);

  const disableNext = useMemo(() => {
    if (dobPickerMode === "day") {
      const nextMonth = new Date(
        dobViewDate.getFullYear(),
        dobViewDate.getMonth() + 1,
        1
      );
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth > now;
    }
    if (dobPickerMode === "month") {
      const nextYear = new Date(
        dobViewDate.getFullYear() + 1,
        dobViewDate.getMonth(),
        1
      );
      nextYear.setHours(0, 0, 0, 0);
      return nextYear > now;
    }
    return yearGrid.end >= currentYear;
  }, [dobPickerMode, dobViewDate, now, yearGrid.end, currentYear]);

  const handleSelectDob = (date: Date) => {
    if (date > now || date < minSelectableDate) return;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const value = `${year}-${month}-${day}`;
    setFormState((previous) => ({ ...previous, dateOfBirth: value }));
    setIsDobPickerOpen(false);
    setDobViewDate(date);
  };

  const shiftDobMonth = (amount: number) => {
    setDobViewDate((previous) => {
      const updated = new Date(previous);
      updated.setDate(1);
      if (dobPickerMode === "day") {
        updated.setMonth(previous.getMonth() + amount);
      } else if (dobPickerMode === "month") {
        updated.setFullYear(previous.getFullYear() + amount);
      } else {
        const targetYear = previous.getFullYear() + amount * 12;
        const boundedYear = Math.min(
          Math.max(targetYear, MIN_YEAR),
          currentYear
        );
        updated.setFullYear(boundedYear);
      }
      updated.setHours(0, 0, 0, 0);
      if (updated > now) {
        return previous;
      }
      if (updated < minSelectableDate) {
        return previous;
      }
      return updated;
    });
  };

  const handleMonthClick = (monthIndex: number) => {
    if (
      visibleYear > currentYear ||
      (visibleYear === currentYear && monthIndex > currentMonth)
    ) {
      return;
    }
    setDobViewDate((previous) => {
      const updated = new Date(previous);
      updated.setDate(1);
      updated.setMonth(monthIndex);
      updated.setHours(0, 0, 0, 0);
      if (updated > now) {
        return previous;
      }
      if (updated < minSelectableDate) {
        return previous;
      }
      return updated;
    });
    setDobPickerMode("day");
  };

  const handleYearClick = (year: number) => {
    if (year > currentYear || year < MIN_YEAR) {
      return;
    }
    setDobViewDate((previous) => {
      const updated = new Date(previous);
      updated.setDate(1);
      updated.setFullYear(year);
      updated.setHours(0, 0, 0, 0);
      if (year === currentYear && updated > now) {
        updated.setMonth(currentMonth);
      }
      if (updated > now) {
        return previous;
      }
      if (updated < minSelectableDate) {
        return previous;
      }
      return updated;
    });
    setDobPickerMode("month");
  };

  function updatePoseFeedbackSafe(message: string) {
    if (feedbackRef.current !== message) {
      feedbackRef.current = message;
      setPoseFeedback(message);
    }
  }

  function updatePoseProgressSafe(value: number) {
    const normalized = Math.max(0, Math.min(100, Math.round(value)));
    if (poseProgressRef.current !== normalized) {
      poseProgressRef.current = normalized;
      setPoseProgress(normalized);
    }
  }

  function clearOverlay() {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawHandOverlay(landmarks: NormalizedLandmark[]) {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks.length) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const xs = landmarks.map((point) => point.x);
    const ys = landmarks.map((point) => point.y);
    const minX = Math.min(...xs) * canvasWidth;
    const maxX = Math.max(...xs) * canvasWidth;
    const minY = Math.min(...ys) * canvasHeight;
    const maxY = Math.max(...ys) * canvasHeight;
    const padding = 24;

    context.strokeStyle = "rgba(14,165,233,0.85)";
    context.lineWidth = 3;
    if (typeof context.roundRect === "function") {
      context.beginPath();
      context.roundRect(
        minX - padding,
        minY - padding,
        maxX - minX + padding * 2,
        maxY - minY + padding * 2,
        16
      );
      context.stroke();
    } else {
      context.strokeRect(
        minX - padding,
        minY - padding,
        maxX - minX + padding * 2,
        maxY - minY + padding * 2
      );
    }

    context.fillStyle = "rgba(14,165,233,0.75)";
    const tipIndexes = [4, 8, 12, 16, 20];
    tipIndexes.forEach((index) => {
      const point = landmarks[index];
      if (!point) return;
      const x = point.x * canvasWidth;
      const y = point.y * canvasHeight;
      context.beginPath();
      context.arc(x, y, 6, 0, Math.PI * 2);
      context.fill();
    });
  }

  function clearCountdown() {
    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    setCountdownValue(null);
    setIsCountdownRunning(false);
    countdownRunningRef.current = false;
  }

  function resetPoseGuidance() {
    poseHoldFrameRef.current = 0;
    poseIndexRef.current = 0;
    setPoseIndex(0);
    updatePoseFeedbackSafe(POSE_SEQUENCE[0].prompt);
    updatePoseProgressSafe(0);
    clearCountdown();
  }

  function evaluateHandPose(
    landmarks: NormalizedLandmark[],
    handednessLabel?: string
  ) {
    const fingerLiftThreshold = 0.02;
    const indexLandmark = landmarks[8];
    const indexPip = landmarks[6];
    const middleLandmark = landmarks[12];
    const middlePip = landmarks[10];
    const ringLandmark = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyLandmark = landmarks[20];
    const pinkyPip = landmarks[18];

    const indexExtended = Boolean(
      indexLandmark &&
        indexPip &&
        indexLandmark.y < indexPip.y - fingerLiftThreshold
    );
    const middleExtended = Boolean(
      middleLandmark &&
        middlePip &&
        middleLandmark.y < middlePip.y - fingerLiftThreshold
    );
    const ringExtended = Boolean(
      ringLandmark &&
        ringPip &&
        ringLandmark.y < ringPip.y - fingerLiftThreshold
    );
    const pinkyExtended = Boolean(
      pinkyLandmark &&
        pinkyPip &&
        pinkyLandmark.y < pinkyPip.y - fingerLiftThreshold
    );

    let thumbExtended = false;
    const thumbTip = landmarks[4];
    const thumbJoint = landmarks[3];
    if (thumbTip && thumbJoint && handednessLabel) {
      const label = handednessLabel.toLowerCase();
      if (label === "right") {
        thumbExtended = thumbTip.x > thumbJoint.x + 0.04;
      } else if (label === "left") {
        thumbExtended = thumbTip.x < thumbJoint.x - 0.04;
      }
    }

    const count = [
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended,
    ].filter(Boolean).length;

    return {
      count,
      extended: {
        thumb: thumbExtended,
        index: indexExtended,
        middle: middleExtended,
        ring: ringExtended,
        pinky: pinkyExtended,
      },
    };
  }

  function capturePhotoFromVideo() {
    if (!videoRef.current || !captureCanvasRef.current) {
      return null;
    }
    if (
      !videoRef.current.videoWidth ||
      !videoRef.current.videoHeight ||
      videoRef.current.readyState < 2
    ) {
      return null;
    }

    const canvas = captureCanvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  function stopDetectionLoop(closeInstance = false) {
    detectionActiveRef.current = false;
    if (detectionRafRef.current !== null) {
      cancelAnimationFrame(detectionRafRef.current);
      detectionRafRef.current = null;
    }
    isProcessingFrameRef.current = false;
    if (closeInstance && handsInstanceRef.current) {
      void handsInstanceRef.current.close();
      handsInstanceRef.current = null;
    }
  }

  function startDetectionLoop() {
    if (!handsInstanceRef.current || !videoRef.current) {
      return;
    }
    detectionActiveRef.current = true;

    const detect = async () => {
      if (
        !detectionActiveRef.current ||
        !handsInstanceRef.current ||
        !videoRef.current
      ) {
        return;
      }

      if (
        isProcessingFrameRef.current ||
        !videoRef.current.videoWidth ||
        !videoRef.current.videoHeight
      ) {
        detectionRafRef.current = requestAnimationFrame(detect);
        return;
      }

      isProcessingFrameRef.current = true;
      try {
        await handsInstanceRef.current.send({ image: videoRef.current });
      } catch (error) {
        console.error("Hand detection failed:", error);
      } finally {
        isProcessingFrameRef.current = false;
      }
      detectionRafRef.current = requestAnimationFrame(detect);
    };

    detectionRafRef.current = requestAnimationFrame(detect);
  }

  function handleAutoCapture() {
    const snapshot = capturePhotoFromVideo();
    clearOverlay();
    if (!snapshot) {
      updatePoseFeedbackSafe(
        "We couldn't capture that frame. Adjust your pose and try again."
      );
      resetPoseGuidance();
      startDetectionLoop();
      return;
    }
    setCapturedPhoto(snapshot);
    updatePoseFeedbackSafe("Photo captured! Review before submitting.");
    updatePoseProgressSafe(0);
    clearCountdown();
  }

  function startCountdown() {
    if (countdownRunningRef.current) {
      return;
    }
    stopDetectionLoop();
    clearCountdown();
    setIsCountdownRunning(true);
    countdownRunningRef.current = true;
    updatePoseFeedbackSafe("Hold your pose. Capturing in a moment...");

    const tick = (value: number) => {
      setCountdownValue(value);
      if (value === 0) {
        handleAutoCapture();
        return;
      }
      countdownTimeoutRef.current = window.setTimeout(() => {
        tick(value - 1);
      }, 1000);
    };

    tick(COUNTDOWN_START_VALUE);
  }

  function handleHandResults(results: HandDetectionResult) {
    if (!detectionActiveRef.current || countdownRunningRef.current) {
      return;
    }

    const landmarksList = results.multiHandLandmarks;
    if (!landmarksList || !landmarksList.length) {
      clearOverlay();
      poseHoldFrameRef.current = 0;
      updatePoseProgressSafe(0);
      const prompt =
        POSE_SEQUENCE[poseIndexRef.current]?.prompt ??
        "Raise your hand inside the frame.";
      updatePoseFeedbackSafe(prompt);
      return;
    }

    const handednessLabel = results.multiHandedness?.[0]?.label;
    const confidence = results.multiHandedness?.[0]?.score ?? 0;

    drawHandOverlay(landmarksList[0]);

    if (confidence < 0.6) {
      poseHoldFrameRef.current = 0;
      updatePoseProgressSafe(0);
      updatePoseFeedbackSafe("Hold steady so we can detect your hand.");
      return;
    }

    const poseMetrics = evaluateHandPose(landmarksList[0], handednessLabel);
    const currentPose = POSE_SEQUENCE[poseIndexRef.current];
    if (!currentPose) {
      return;
    }

    const matchesTarget =
      (currentPose.fingerCount === 1 && poseMetrics.count === 1) ||
      (currentPose.fingerCount === 2 && poseMetrics.count === 2) ||
      (currentPose.fingerCount === 3 && poseMetrics.count >= 3);

    if (matchesTarget) {
      poseHoldFrameRef.current += 1;
      const progressRatio =
        (poseHoldFrameRef.current / HOLD_FRAMES_REQUIRED) * 100;
      updatePoseProgressSafe(progressRatio);

      if (poseHoldFrameRef.current >= HOLD_FRAMES_REQUIRED) {
        poseHoldFrameRef.current = 0;
        updatePoseProgressSafe(100);
        if (poseIndexRef.current === POSE_SEQUENCE.length - 1) {
          startCountdown();
        } else {
          const nextIndex = Math.min(
            poseIndexRef.current + 1,
            POSE_SEQUENCE.length - 1
          );
          poseIndexRef.current = nextIndex;
          setPoseIndex(nextIndex);
          updatePoseFeedbackSafe(POSE_SEQUENCE[nextIndex].prompt);
          window.setTimeout(() => {
            updatePoseProgressSafe(0);
          }, 200);
        }
      } else {
        updatePoseFeedbackSafe("Great! Keep holding that pose.");
      }
    } else {
      if (poseHoldFrameRef.current !== 0) {
        poseHoldFrameRef.current = 0;
        updatePoseProgressSafe(0);
      }
      updatePoseFeedbackSafe(currentPose.prompt);
    }
  }

  async function initializeHands() {
    if (handsInstanceRef.current) {
      try {
        await handsInstanceRef.current.close();
      } catch (error) {
        console.error("Failed to dispose previous hands instance:", error);
      }
      handsInstanceRef.current = null;
    }

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });
    hands.onResults(handleHandResults);
    handsInstanceRef.current = hands;
  }

  function syncOverlayDimensions() {
    if (!videoRef.current || !overlayCanvasRef.current) {
      return;
    }
    overlayCanvasRef.current.width = videoRef.current.videoWidth || 0;
    overlayCanvasRef.current.height = videoRef.current.videoHeight || 0;
  }

  async function startCamera() {
    try {
      resetPoseGuidance();
      clearOverlay();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (!videoRef.current) {
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) {
          resolve();
          return;
        }
        if (videoRef.current.readyState >= 2) {
          resolve();
          return;
        }
        const handleLoadedMetadata = () => {
          videoRef.current?.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          resolve();
        };
        videoRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      });

      await videoRef.current
        .play()
        .then(() => undefined)
        .catch(() => undefined);

      syncOverlayDimensions();
      setIsCameraReady(true);
      await initializeHands();
      startDetectionLoop();
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "We couldn't access your camera. Please check permissions and try again."
      );
      stopCamera();
    }
  }

  function stopCamera(closeInstance = true) {
    stopDetectionLoop(closeInstance);
    clearCountdown();
    clearOverlay();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }

  const handleOpenCamera = () => {
    setCameraError(null);
    setCapturedPhoto(null);
    resetPoseGuidance();
    setIsCameraOpen(true);
    window.setTimeout(() => {
      startCamera();
    }, 80);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setCameraError(null);
    resetPoseGuidance();
    clearOverlay();
    if (handsInstanceRef.current) {
      startDetectionLoop();
    } else {
      initializeHands()
        .then(() => {
          startDetectionLoop();
        })
        .catch(() => {
          setCameraError(
            "Unable to restart detection. Please close and reopen the camera."
          );
        });
    }
  };

  const handleSubmitPhoto = () => {
    if (!capturedPhoto) {
      return;
    }
    setFormState((prev) => ({ ...prev, photoProfile: capturedPhoto }));
    stopCamera();
    setIsCameraOpen(false);
    setCapturedPhoto(null);
    setCameraError(null);
    resetPoseGuidance();
  };

  const handleCloseCameraModal = () => {
    stopCamera();
    setIsCameraOpen(false);
    setCapturedPhoto(null);
    setCameraError(null);
    resetPoseGuidance();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) {
    return null;
  }

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
              {isFieldVisible("photo_profile") && (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Photo Profile
                    {isFieldRequired("photo_profile") && (
                      <span className="text-rose-500">*</span>
                    )}
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-6 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-500 overflow-hidden">
                      {formState.photoProfile ? (
                        <img
                          src={formState.photoProfile}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCircleUser}
                          className="h-12 w-12"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 items-center md:items-start">
                      <p className="text-sm text-slate-500">
                        Take a photo that clearly shows your face.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCamera}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
                      >
                        <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                        {formState.photoProfile
                          ? "Retake Picture"
                          : "Take a Picture"}
                      </button>
                    </div>
                  </div>
                  {formErrors.photoProfile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="h-4 w-4"
                      />
                      <span>{formErrors.photoProfile}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-5">
                {isFieldVisible("full_name") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Full name
                      {isFieldRequired("full_name") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formState.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
                          formErrors.fullName
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-sky-400 focus:ring-sky-200"
                        }`}
                      />
                      {formErrors.fullName && (
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="h-4 w-4 text-red-400"
                          />
                        </div>
                      )}
                    </div>
                    {formErrors.fullName && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="h-4 w-4"
                        />
                        <span>{formErrors.fullName}</span>
                      </div>
                    )}
                  </div>
                )}

                {isFieldVisible("date_of_birth") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Date of birth
                      {isFieldRequired("date_of_birth") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <div ref={dobPickerRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDobPickerOpen((previous) => {
                            const next = !previous;
                            if (!previous) {
                              const nextViewDate = selectedDate
                                ? new Date(selectedDate)
                                : (() => {
                                    const fallback = new Date();
                                    fallback.setFullYear(
                                      fallback.getFullYear() - 21
                                    );
                                    return fallback;
                                  })();
                              nextViewDate.setHours(0, 0, 0, 0);
                              if (nextViewDate < minSelectableDate) {
                                setDobViewDate(new Date(minSelectableDate));
                              } else {
                                setDobViewDate(nextViewDate);
                              }
                              setDobPickerMode("day");
                            } else {
                              setDobPickerMode("day");
                            }
                            return next;
                          });
                          setFormErrors((prev) => ({
                            ...prev,
                            dateOfBirth: "",
                          }));
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          formErrors.dateOfBirth
                            ? "border-red-400 focus-visible:outline-red-200"
                            : isDobPickerOpen
                            ? "border-sky-400 focus-visible:outline-sky-200"
                            : "border-slate-200 focus-visible:outline-sky-200"
                        } ${
                          selectedDate ? "text-slate-900" : "text-slate-400"
                        }`}
                        aria-haspopup="dialog"
                        aria-expanded={isDobPickerOpen}
                      >
                        <span>{dobDisplayLabel}</span>
                        <div className="flex items-center gap-2">
                          {formErrors.dateOfBirth && (
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="h-4 w-4 text-red-400"
                            />
                          )}
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="h-4 w-4 text-slate-400"
                          />
                        </div>
                      </button>
                      {isDobPickerOpen && (
                        <div className="absolute left-0 top-full z-20 mt-3 w-full rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)]">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => shiftDobMonth(-1)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Previous"
                              disabled={disablePrev}
                            >
                              <FontAwesomeIcon
                                icon={faChevronLeft}
                                className="h-3 w-3"
                              />
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDobPickerMode("month")}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 ${
                                  dobPickerMode === "month"
                                    ? "bg-sky-100 text-sky-600"
                                    : "text-slate-700 hover:bg-slate-100"
                                }`}
                                aria-pressed={dobPickerMode === "month"}
                              >
                                {visibleMonthName}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDobPickerMode("year")}
                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 ${
                                  dobPickerMode === "year"
                                    ? "bg-sky-100 text-sky-600"
                                    : "text-slate-700 hover:bg-slate-100"
                                }`}
                                aria-pressed={dobPickerMode === "year"}
                              >
                                {visibleYear}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => shiftDobMonth(1)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Next"
                              disabled={disableNext}
                            >
                              <FontAwesomeIcon
                                icon={faChevronRight}
                                className="h-3 w-3"
                              />
                            </button>
                          </div>
                          {dobPickerMode === "day" && (
                            <>
                              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {DAY_LABELS.map((day) => (
                                  <div key={day}>{day}</div>
                                ))}
                              </div>
                              <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
                                {calendarDays.map((date) => {
                                  const isCurrentMonth =
                                    date.getMonth() ===
                                      dobViewDate.getMonth() &&
                                    date.getFullYear() ===
                                      dobViewDate.getFullYear();
                                  const isSelected =
                                    selectedDate &&
                                    date.getTime() === selectedDate.getTime();
                                  const isToday =
                                    date.getTime() === now.getTime();
                                  const isDisabled =
                                    date > now || date < minSelectableDate;

                                  return (
                                    <button
                                      key={date.toISOString()}
                                      type="button"
                                      onClick={() => handleSelectDob(date)}
                                      disabled={isDisabled}
                                      className={`inline-flex h-10 w-full items-center justify-center rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 ${
                                        isSelected
                                          ? "border-sky-500 bg-sky-500 text-white shadow"
                                          : isToday
                                          ? "border-slate-200 bg-slate-100 text-slate-800"
                                          : "border-transparent"
                                      } ${
                                        isCurrentMonth
                                          ? "text-slate-700"
                                          : "text-slate-300"
                                      } ${
                                        isDisabled
                                          ? "cursor-not-allowed opacity-50"
                                          : "hover:border-slate-200 hover:bg-slate-50"
                                      }`}
                                      aria-pressed={Boolean(isSelected)}
                                      aria-label={new Intl.DateTimeFormat(
                                        "en-US",
                                        {
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric",
                                        }
                                      ).format(date)}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          {dobPickerMode === "month" && (
                            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                              {MONTH_LABELS.map((monthName, index) => {
                                const isSelectedMonth =
                                  dobViewDate.getMonth() === index;
                                const isDisabled =
                                  visibleYear > currentYear ||
                                  (visibleYear === currentYear &&
                                    index > currentMonth);
                                return (
                                  <button
                                    key={monthName}
                                    type="button"
                                    onClick={() => handleMonthClick(index)}
                                    disabled={isDisabled}
                                    className={`rounded-xl px-3 py-2 text-center font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 ${
                                      isSelectedMonth
                                        ? "bg-sky-500 text-white shadow"
                                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    } ${
                                      isDisabled
                                        ? "cursor-not-allowed opacity-40"
                                        : ""
                                    }`}
                                  >
                                    {monthName.slice(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {dobPickerMode === "year" && (
                            <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
                              {yearGrid.years.map((year) => {
                                const isSelectedYear =
                                  dobViewDate.getFullYear() === year;
                                const isDisabled = year > currentYear;
                                return (
                                  <button
                                    key={year}
                                    type="button"
                                    onClick={() => handleYearClick(year)}
                                    disabled={isDisabled}
                                    className={`rounded-xl px-3 py-2 text-center font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200 ${
                                      isSelectedYear
                                        ? "bg-sky-500 text-white shadow"
                                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    } ${
                                      isDisabled
                                        ? "cursor-not-allowed opacity-40"
                                        : ""
                                    }`}
                                  >
                                    {year}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.dateOfBirth && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="h-4 w-4"
                        />
                        <span>{formErrors.dateOfBirth}</span>
                      </div>
                    )}
                  </div>
                )}

                {isFieldVisible("gender") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Pronoun (gender)
                      {isFieldRequired("gender") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <fieldset
                      className={`rounded-2xl border bg-white px-5 py-4 ${
                        formErrors.pronoun
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    >
                      <legend className="sr-only">Pronoun (gender)</legend>
                      <div className="flex flex-wrap items-center gap-4">
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
                        {formErrors.pronoun && (
                          <div className="flex w-full items-center gap-2 text-sm text-red-500">
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="h-4 w-4"
                            />
                            <span>{formErrors.pronoun}</span>
                          </div>
                        )}
                      </div>
                    </fieldset>
                  </div>
                )}

                {isFieldVisible("domicile") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Domicile
                      {isFieldRequired("domicile") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <div
                      ref={domicileDropdownRef}
                      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 ${
                        formErrors.domicile
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDomicileDropdownOpen((previous) => !previous);
                            setFormErrors((prev) => ({
                              ...prev,
                              domicile: "",
                            }));
                          }}
                          className="flex w-full items-center justify-between text-left text-sm text-slate-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:rounded-md"
                          aria-haspopup="listbox"
                          aria-expanded={isDomicileDropdownOpen}
                          aria-label="Select domicile"
                        >
                          <span
                            className={
                              selectedDomicile.id === "" ? "text-slate-400" : ""
                            }
                          >
                            {selectedDomicile.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {formErrors.domicile && (
                              <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                className="h-4 w-4 text-red-400"
                              />
                            )}
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className="h-4 w-4 text-slate-400"
                            />
                          </div>
                        </button>
                        {isDomicileDropdownOpen && (
                          <ul
                            className="absolute left-0 top-full z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] custom-scrollbar"
                            role="listbox"
                          >
                            {DOMICILE_OPTIONS.slice(1).map((domicile) => (
                              <li key={domicile.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDomicile(domicile);
                                    setIsDomicileDropdownOpen(false);
                                  }}
                                  className={`flex w-full items-center px-4 py-3 text-left text-sm transition ${
                                    selectedDomicile.id === domicile.id
                                      ? "bg-sky-50 text-slate-900"
                                      : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                  role="option"
                                  aria-selected={
                                    selectedDomicile.id === domicile.id
                                  }
                                >
                                  {domicile.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    {formErrors.domicile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="h-4 w-4"
                        />
                        <span>{formErrors.domicile}</span>
                      </div>
                    )}
                  </div>
                )}

                {isFieldVisible("phone_number") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Phone number
                      {isFieldRequired("phone_number") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <div
                      ref={countryDropdownRef}
                      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 ${
                        formErrors.phoneNumber
                          ? "border-red-400"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsCountryDropdownOpen((previous) => {
                              const next = !previous;
                              if (!previous) {
                                setCountrySearch("");
                              }
                              return next;
                            })
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
                          <div className="absolute left-0 top-full z-10 mt-2 w-52 rounded-2xl border border-slate-100 bg-white shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)]">
                            <div className="px-3 pt-3">
                              <label className="relative block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <span className="sr-only">Search country</span>
                                <input
                                  type="text"
                                  value={countrySearch}
                                  onChange={(event) =>
                                    setCountrySearch(event.target.value)
                                  }
                                  placeholder="Search country"
                                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                              </label>
                            </div>
                            <ul
                              className="custom-scrollbar max-h-60 overflow-y-auto py-2"
                              role="listbox"
                            >
                              {filteredCountryOptions.length ? (
                                filteredCountryOptions.map((country) => (
                                  <li key={country.id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        setIsCountryDropdownOpen(false);
                                        setCountrySearch("");
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
                                ))
                              ) : (
                                <li className="px-4 py-3 text-sm text-slate-400">
                                  No matches
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formState.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="81212345678"
                          className="h-10 w-full border-none bg-transparent pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                        {formErrors.phoneNumber && (
                          <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              className="h-4 w-4 text-red-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {formErrors.phoneNumber && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="h-4 w-4"
                        />
                        <span>{formErrors.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {isFieldVisible("email") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Email
                      {isFieldRequired("email") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email address"
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
                          formErrors.email
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-sky-400 focus:ring-sky-200"
                        }`}
                      />
                      {formErrors.email && (
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="h-4 w-4 text-red-400"
                          />
                        </div>
                      )}
                    </div>
                    {formErrors.email && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="h-4 w-4"
                        />
                        <span>{formErrors.email}</span>
                      </div>
                    )}
                  </div>
                )}

                {isFieldVisible("linkedin_link") && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      Link LinkedIn
                      {isFieldRequired("linkedin_link") && (
                        <span className="text-rose-500">*</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        name="linkedin"
                        value={formState.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
                          formErrors.linkedin
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-sky-400 focus:ring-sky-200"
                        }`}
                      />
                      {formErrors.linkedin && (
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="h-4 w-4 text-red-400"
                          />
                        </div>
                      )}
                    </div>
                    {formErrors.linkedin && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="h-4 w-4"
                        />
                        <span>{formErrors.linkedin}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="border-t border-slate-100 bg-white px-8 py-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCameraModal();
            }
          }}
        >
          <div className="relative flex h-screen w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[95vh] sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Raise Your Hand to Capture
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Follow the finger sequence to trigger an automatic snapshot.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close camera"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>

            {/* Camera/Preview Area */}
            <div className="relative flex-1 w-full bg-slate-900">
              {!capturedPhoto ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <div className="text-center">
                        <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
                        <p className="text-sm text-white">Starting camera...</p>
                      </div>
                    </div>
                  )}
                  {isCameraReady && !isCountdownRunning && (
                    <div className="pointer-events-none absolute left-4 top-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/85 px-3 py-1 text-xs font-semibold text-white shadow">
                        Pose {Math.min(poseIndex + 1, POSE_SEQUENCE.length)}
                      </span>
                    </div>
                  )}
                  {isCountdownRunning && countdownValue !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/70 bg-slate-900/80 text-4xl font-bold text-white shadow-lg">
                        {countdownValue}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="h-full w-full object-cover"
                />
              )}
              <canvas ref={captureCanvasRef} className="hidden" />
            </div>

            {/* Instructions & Actions */}
            <div className="border-t border-slate-100 bg-white px-6 py-5">
              {cameraError ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {cameraError}
                </div>
              ) : null}
              <div className="space-y-5">
                {cameraError ? null : !capturedPhoto ? (
                  <>
                    <p className="text-center text-sm text-slate-600">
                      {poseFeedback}
                    </p>
                    <div className="mx-auto h-2 w-full max-w-md rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-200"
                        style={{ width: `${poseProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      {POSE_SEQUENCE.map((pose, index) => {
                        const isCompleted = index < poseIndex;
                        const isActive = index === poseIndex;
                        return (
                          <div
                            key={pose.id}
                            className="flex flex-1 flex-col items-center gap-2 text-center"
                          >
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                                isCompleted
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                  : isActive
                                  ? "border-sky-500 bg-sky-50 text-sky-600"
                                  : "border-slate-200 text-slate-400"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                isCompleted
                                  ? "text-emerald-600"
                                  : isActive
                                  ? "text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {pose.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-xs text-slate-400">
                      Sequence: raise 1 finger, then 2 fingers, then 3 fingers.
                      We&apos;ll start a 3 second countdown once the final pose
                      is detected.
                    </p>
                  </>
                ) : (
                  <p className="text-center text-sm text-slate-600">
                    Happy with this shot? Save it or retake another one.
                  </p>
                )}
              </div>
              <div className="mt-5 flex gap-3">
                {capturedPhoto ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                    >
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitPhoto}
                      className="flex-1 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                      Use Photo
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplyJobModal;
