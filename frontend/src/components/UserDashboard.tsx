import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleUser,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";

type UserDashboardProps = {
  onLogout: () => void;
};

function UserDashboard({ onLogout }: UserDashboardProps) {
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-6 shadow-sm sm:px-12">
        <span className="text-2xl font-semibold">Jobby</span>
        <div className="relative">
          <button
            ref={profileButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-sm transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
            aria-label="Buka menu profil pengguna"
            aria-expanded={isMenuOpen}
          >
            <FontAwesomeIcon icon={faCircleUser} className="h-6 w-6" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-[0_26px_60px_-35px_rgba(15,23,42,0.55)] z-50"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Logout
                <span className="text-xs text-slate-400">Ctrl+L</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 text-center">
        <div className="flex h-56 w-56 items-center justify-center rounded-full bg-sky-50">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="h-24 w-24 text-sky-500"
          />
        </div>
        <h2 className="mt-12 text-2xl font-semibold text-slate-900">
          No job openings available
        </h2>
        <p className="mt-4 max-w-md text-sm text-slate-500">
          Please wait for the next batch of openings.
        </p>
      </main>
    </div>
  );
}

export default UserDashboard;

