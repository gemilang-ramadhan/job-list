import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const openPasswordLogin = async () => {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Masuk dengan kata sandi" })
  );
  return user;
};

describe("App authentication roles", () => {
  const adminCredentials = {
    email: "admin@gmail.com",
    password: "admin",
  };
  const userCredentials = {
    email: "user@gmail.com",
    password: "user",
  };

  test("admin credential directs to admin dashboard", async () => {
    render(<App />);

    const user = await openPasswordLogin();

    await user.type(
      screen.getByLabelText("Alamat email"),
      adminCredentials.email
    );
    await user.type(
      screen.getByLabelText("Kata sandi"),
      adminCredentials.password
    );
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByText("Job List")).toBeInTheDocument();
    expect(window.localStorage.getItem("jobby-session-role")).toBe("admin");
  });

  test("user credential directs to user dashboard", async () => {
    render(<App />);

    const user = await openPasswordLogin();

    await user.type(
      screen.getByLabelText("Alamat email"),
      userCredentials.email
    );
    await user.type(
      screen.getByLabelText("Kata sandi"),
      userCredentials.password
    );
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByText("Jobby")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create a new job" })
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem("jobby-session-role")).toBe("user");
  });
});
