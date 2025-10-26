import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserDashboard from "../components/UserDashboard";
import {
  JOB_DRAFT_STORAGE_KEY,
  type StoredJob,
} from "../types/jobs";

const renderDashboard = () => render(<UserDashboard onLogout={vi.fn()} />);

const createJob = (overrides: Partial<StoredJob> = {}): StoredJob => {
  const { formValues: overrideFormValues, ...restOverrides } = overrides;
  return {
    id: `job_${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    savedAt: "2025-10-25T12:00:00.000Z",
    publishedAt: "2025-10-25T12:00:00.000Z",
    formValues: {
      jobName: "Product Designer",
      jobType: "full-time",
      jobDescription: "Design experiences.\nCollaborate with peers.",
      candidatesNeeded: "1",
      minSalary: "7000000",
      maxSalary: "9000000",
      ...overrideFormValues,
    },
    profileFields: [],
    ...restOverrides,
  };
};

describe("UserDashboard", () => {
  beforeEach(() => {
    window.localStorage.removeItem(JOB_DRAFT_STORAGE_KEY);
  });

  test("renders empty state when there are no active jobs", () => {
    renderDashboard();

    expect(
      screen.getByText("No job openings available")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Please check back soon. New opportunities appear here the moment Jobby publishes them."
      )
    ).toBeInTheDocument();
  });

  test("shows only active jobs from storage", () => {
    const activeJob = createJob({
      id: "job_active_001",
      formValues: {
        jobName: "Frontend Engineer",
        jobType: "full-time",
      },
    });
    const draftJob: StoredJob = {
      ...createJob({
        id: "job_draft_001",
        formValues: {
          jobName: "Draft Role",
        },
      }),
      status: "draft",
      publishedAt: undefined,
    };

    window.localStorage.setItem(
      JOB_DRAFT_STORAGE_KEY,
      JSON.stringify([activeJob, draftJob])
    );

    renderDashboard();

    expect(
      screen.getByRole("button", { name: /Frontend Engineer/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Draft Role")).not.toBeInTheDocument();
  });

  test("expands job detail view when a card is clicked", async () => {
    const user = userEvent.setup();
    const activeJob = createJob({
      id: "job_active_detail",
      formValues: {
        jobName: "UI Engineer",
        jobType: "contract",
        jobDescription: "Design systems.\nShip UI components.",
      },
    });

    window.localStorage.setItem(
      JOB_DRAFT_STORAGE_KEY,
      JSON.stringify([activeJob])
    );

    renderDashboard();

    await user.click(screen.getByRole("button", { name: /UI Engineer/i }));

    expect(
      await screen.findByText("Apply", { selector: "button" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Design systems.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ship UI components.")
    ).toBeInTheDocument();
  });
});
