export type CandidateAttribute = {
  key: string;
  label: string;
  value: string;
  order: number;
};

export type StoredCandidate = {
  id: string;
  jobId: string;
  submittedAt: string;
  attributes: CandidateAttribute[];
};

export const JOB_CANDIDATE_STORAGE_KEY = "jobCandidates";
export const JOB_CANDIDATE_UPDATED_EVENT = "job-candidates:updated";

const formatTwoDigits = (value: number) => value.toString().padStart(2, "0");

export const createCandidateId = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = formatTwoDigits(date.getMonth() + 1);
  const day = formatTwoDigits(date.getDate());
  const random = Math.floor(1000 + Math.random() * 9000);
  return `cand_${year}${month}${day}_${random}`;
};

const isCandidateAttribute = (value: unknown): value is CandidateAttribute => {
  if (!value || typeof value !== "object") return false;
  const attribute = value as CandidateAttribute;
  return (
    typeof attribute.key === "string" &&
    typeof attribute.label === "string" &&
    typeof attribute.value === "string" &&
    typeof attribute.order === "number"
  );
};

const isStoredCandidate = (value: unknown): value is StoredCandidate => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as StoredCandidate;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.jobId === "string" &&
    typeof candidate.submittedAt === "string" &&
    Array.isArray(candidate.attributes) &&
    candidate.attributes.every(isCandidateAttribute)
  );
};

export const parseCandidatesFromValue = (
  value: string | null
): StoredCandidate[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isStoredCandidate)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
  } catch (error) {
    console.error("Failed to parse stored candidates", error);
    return [];
  }
};

export const getCandidatesFromStorage = (): StoredCandidate[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(JOB_CANDIDATE_STORAGE_KEY);
  return parseCandidatesFromValue(raw);
};

export const getCandidatesForJob = (jobId: string): StoredCandidate[] => {
  return getCandidatesFromStorage().filter(
    (candidate) => candidate.jobId === jobId
  );
};

export const writeCandidatesToStorage = (candidates: StoredCandidate[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    JOB_CANDIDATE_STORAGE_KEY,
    JSON.stringify(candidates)
  );
};

export const appendCandidateToStorage = (
  candidate: StoredCandidate
): StoredCandidate[] => {
  const existing = getCandidatesFromStorage();
  const next = [candidate, ...existing];
  writeCandidatesToStorage(next);
  return next;
};
