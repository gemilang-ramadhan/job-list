export type FieldRequirement = "Mandatory" | "Optional" | "Off";

export type ProfileField = {
  key: string;
  label: string;
  requirement: FieldRequirement;
};

export type JobStatus = "draft" | "active";

export type StoredJob = {
  id: string;
  status: JobStatus;
  savedAt: string;
  publishedAt?: string;
  formValues: {
    jobName?: string;
    jobType?: string;
    jobDescription?: string;
    candidatesNeeded?: string;
    minSalary?: string;
    maxSalary?: string;
  };
  profileFields: ProfileField[];
};

export const JOB_DRAFT_STORAGE_KEY = "jobDrafts";

export const getDefaultProfileFields = (): ProfileField[] => [
  { key: "full_name", label: "Full name", requirement: "Mandatory" },
  { key: "photo_profile", label: "Photo Profile", requirement: "Mandatory" },
  { key: "gender", label: "Gender", requirement: "Mandatory" },
  { key: "domicile", label: "Domicile", requirement: "Mandatory" },
  { key: "email", label: "Email", requirement: "Mandatory" },
  { key: "phone_number", label: "Phone number", requirement: "Mandatory" },
  { key: "linkedin_link", label: "LinkedIn link", requirement: "Mandatory" },
  { key: "date_of_birth", label: "Date of birth", requirement: "Mandatory" },
];

const parseJobs = (value: string | null): StoredJob[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is StoredJob => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as StoredJob;
        return (
          typeof candidate.id === "string" &&
          (candidate.status === "draft" || candidate.status === "active")
        );
      })
      .sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
  } catch (error) {
    console.error("Failed to parse draft jobs", error);
    return [];
  }
};

export const parseDraftJobs = (value: string | null): StoredJob[] => {
  return parseJobs(value).filter((job) => job.status === "draft");
};

export const parseActiveJobs = (value: string | null): StoredJob[] => {
  return parseJobs(value).filter((job) => job.status === "active");
};

export const parseAllJobs = (value: string | null): StoredJob[] => {
  return parseJobs(value);
};

export const getAllJobs = (): StoredJob[] => {
  if (typeof window === "undefined") return [];
  const rawValue = window.localStorage.getItem(JOB_DRAFT_STORAGE_KEY);
  return parseAllJobs(rawValue);
};
