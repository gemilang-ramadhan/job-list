import type { ReactElement } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { StoredJob } from "../types/jobs";
import AdminDashboard from "../components/AdminDashboard";

type MockedJobModalProps = {
  isOpen: boolean;
  initialDraft?: StoredJob | null;
  onClose: () => void;
  onDraftSaved?: (
    draft: StoredJob,
    options?: { isPublishingNew?: boolean }
  ) => void;
  onDraftDeleted?: (draftId: string) => void;
};

const jobModalMock: {
  latestProps?: MockedJobModalProps;
} = {};

vi.mock("../components/JobOpeningModal", () => {
  return {
    __esModule: true,
    default: (props: MockedJobModalProps): ReactElement | null => {
      jobModalMock.latestProps = props;
      return props.isOpen ? (
        <div data-testid="job-opening-modal" />
      ) : null;
    },
  };
});

describe("AdminDashboard", () => {
  beforeEach(() => {
    jobModalMock.latestProps = undefined;
  });

  const renderDashboard = (onLogout = vi.fn()) => {
    return render(<AdminDashboard onLogout={onLogout} />);
  };

  const createStoredJob = (
    overrides: Partial<StoredJob> = {}
  ): StoredJob => {
    const {
      formValues: overrideFormValues,
      profileFields: overrideProfileFields,
      ...restOverrides
    } = overrides;

    return {
      id: "job_20251001_0001",
      status: "draft",
      savedAt: "2025-10-01T00:00:00.000Z",
      publishedAt: undefined,
      formValues: {
        jobName: "Default Job",
        jobType: "full-time",
        jobDescription: "Sample description",
        candidatesNeeded: "2",
        minSalary: "5000000",
        maxSalary: "7000000",
        ...overrideFormValues,
      },
      profileFields: overrideProfileFields ?? [],
      ...restOverrides,
    };
  };

  test("shows empty state when there are no stored jobs", () => {
    window.localStorage.removeItem("jobDrafts");

    renderDashboard();

    expect(
      screen.getByText("No job openings available")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create a new job" })
    ).toBeInTheDocument();
  });

  test("renders active and draft jobs from storage", async () => {
    const storedJobs: StoredJob[] = [
      createStoredJob({
        id: "job_active_001",
        status: "active",
        savedAt: "2025-10-05T10:00:00.000Z",
        publishedAt: "2025-10-06T10:00:00.000Z",
        formValues: {
          jobName: "Frontend Developer",
          jobType: "full-time",
          candidatesNeeded: "3",
          minSalary: "7000000",
          maxSalary: "9000000",
        },
      }),
      createStoredJob({
        id: "job_draft_001",
        status: "draft",
        savedAt: "2025-10-04T09:00:00.000Z",
        formValues: {
          jobName: "Backend Engineer",
          jobType: "contract",
          candidatesNeeded: "1",
        },
      }),
    ];
    window.localStorage.setItem("jobDrafts", JSON.stringify(storedJobs));

    renderDashboard();

    expect(screen.getByText("Active Jobs")).toBeInTheDocument();
    expect(screen.getByText("1 active")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Frontend Developer" })
    ).toBeInTheDocument();

    expect(screen.getByText("Draft Jobs")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Backend Engineer" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Manage Job")).toHaveLength(2);
  });

  test("invokes onLogout when admin confirms logout from menu", async () => {
    window.localStorage.removeItem("jobDrafts");
    const onLogout = vi.fn();
    const user = userEvent.setup();

    renderDashboard(onLogout);

    await user.click(
      screen.getByRole("button", { name: "Buka menu profil admin" })
    );
    await user.click(screen.getByRole("button", { name: /Logout/ }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  test("shows a success notification when a new job is published", async () => {
    window.localStorage.removeItem("jobDrafts");
    renderDashboard();

    const persistedJob = createStoredJob({
      id: "job_active_1234",
      status: "active",
      savedAt: "2025-10-07T08:30:00.000Z",
      publishedAt: "2025-10-07T08:30:00.000Z",
      formValues: {
        jobName: "Product Designer",
        jobType: "internship",
        candidatesNeeded: "1",
        minSalary: "4500000",
        maxSalary: "5500000",
      },
    });

    expect(jobModalMock.latestProps).toBeDefined();

    await act(async () => {
      jobModalMock.latestProps?.onDraftSaved?.(persistedJob, {
        isPublishingNew: true,
      });
    });

    expect(
      await screen.findByText("Job vacancy successfully created")
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Product Designer" })
    ).toBeInTheDocument();
  });
});
