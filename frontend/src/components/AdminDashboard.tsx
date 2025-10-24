import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faUserTie,
  faBullhorn,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";

type AdminDashboardProps = {
  onLogout: () => void;
};

function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isMenuOpen) return;
      const target = event.target as Node;
      if (
        !profileButtonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    onLogout();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-8 py-6 sm:px-12">
        <span className="text-2xl font-semibold">Job List</span>
        <div className="relative">
          <button
            ref={profileButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
            aria-label="Buka menu profil admin"
            aria-expanded={isMenuOpen}
          >
            <FontAwesomeIcon icon={faCircleUser} className="h-6 w-6" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.55)]"
            >
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Logout
                <span className="text-xs text-slate-400">Ctrl+L</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-16 pt-12 sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            <div className="relative flex-1">
              <input
                type="search"
                placeholder="Search by job details"
                className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 pr-16 text-sm text-slate-600 shadow-[0_14px_40px_-35px_rgba(15,23,42,0.8)] transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500"
              />
            </div>

            <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-[0_18px_44px_-24px_rgba(15,23,42,0.7)]">
              <div className="flex h-full flex-col justify-between gap-6 p-6">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <FontAwesomeIcon icon={faBullhorn} className="h-6 w-6 text-amber-300" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Recruit the best candidates</p>
                    <p className="text-sm text-slate-200">
                      Create jobs, invite, and hire with ease
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
                >
                  Create a new job
                </button>
              </div>
            </div>
          </div>

          <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 py-24 text-center shadow-[0_40px_90px_-65px_rgba(15,23,42,0.45)]">
            <div className="flex h-56 w-56 items-center justify-center rounded-full bg-sky-50">
              <FontAwesomeIcon icon={faUserTie} className="h-24 w-24 text-sky-500" />
            </div>
            <h2 className="mt-12 text-2xl font-semibold text-slate-900">
              No job openings available
            </h2>
            <p className="mt-4 max-w-md text-sm text-slate-500">
              Create a job opening now and start the candidate process.
            </p>
            <button
              type="button"
              className="mt-10 rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              Create a new job
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
