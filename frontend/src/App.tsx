import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faEye,
  faEyeSlash,
  faEnvelope,
  faArrowLeft,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import type { ReactNode } from "react";
import { useState } from "react";

function App() {
  // isPasswordMode controls whether the password-login fields are visible
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  // isRegisterMode controls the overall Register flow (separate from password-login)
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSent, setIsSent] = useState(false);

  if (isSent) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-10 text-center shadow-md">
          <h2 className="text-2xl font-semibold text-slate-900">
            Periksa Email Anda (MOCKUP ONLY)
          </h2>
          <p className="mt-4 text-sm text-slate-500">
            Kami sudah mengirimkan link login ke
            <span className="font-medium text-slate-900"> {email} </span>
            yang berlaku dalam <span className="font-medium">30 menit</span>
          </p>

          <div className="mt-8 flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-slate-50">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="h-20 w-20 text-sky-500"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 w-full max-w-2xl">
          <button
            type="button"
            onClick={() => {
              setIsSent(false);
              setIsForgotPassword(false);
              setIsRegisterMode(false);
              setIsPasswordMode(false);
            }}
            className="w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
        <div className="rounded-3xl bg-white p-8 shadow-[0_40px_80px_-60px_rgba(15,23,42,0.6)] ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white font-semibold">
              J
            </div>
            <span className="text-2xl font-semibold text-slate-800">Jobby</span>
          </div>

          <div className="mt-8 space-y-2">
            {isForgotPassword && (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="flex items-center gap-2 text-sm font-medium text-sky-500 hover:text-sky-600 -ml-1 mb-4"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                Kembali
              </button>
            )}
            <h1 className="text-2xl font-semibold text-slate-900">
              {isForgotPassword
                ? "Selamat datang di Jobby"
                : isRegisterMode
                ? "Bergabung dengan Jobby"
                : "Masuk ke Jobby"}
            </h1>
            {isForgotPassword ? (
              <p className="text-sm text-slate-500">
                Masukan alamat email yang telah terdaftar menerima email reset
                kata sandi.
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {isRegisterMode ? (
                  <>
                    Sudah punya akun?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsRegisterMode(false);
                        setIsPasswordMode(false);
                        setIsForgotPassword(false);
                      }}
                      className="font-medium text-sky-500 hover:text-sky-600"
                    >
                      Masuk
                    </a>
                  </>
                ) : (
                  <>
                    Belum punya akun?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsRegisterMode(true);
                        setIsPasswordMode(false);
                        setIsForgotPassword(false);
                      }}
                      className="font-medium text-sky-500 hover:text-sky-600"
                    >
                      Daftar menggunakan email
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <label className="block text-sm font-medium text-slate-700">
              Alamat email
              <div className="relative mt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="nama@contoh.com"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`w-full rounded-xl px-4 py-3 text-slate-900 shadow-inner transition focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border border-red-400 focus:border-red-400 focus:ring-red-100"
                      : "border border-slate-200 focus:border-sky-400 focus:ring-sky-200"
                  }`}
                />

                {emailError && (
                  <p
                    id="email-error"
                    className="mt-2 flex items-center gap-2 text-sm text-red-600"
                  >
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="h-4 w-4"
                    />
                    {emailError}
                  </p>
                )}
              </div>
            </label>

            <div
              className={`grid transition-all duration-500 ease-in-out ${
                isPasswordMode && !isForgotPassword
                  ? "grid-rows-[1fr]"
                  : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-6">
                  <label className="block text-sm font-medium text-slate-700">
                    Kata sandi
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 shadow-inner transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="h-5 w-5"
                        />
                      </button>
                    </div>
                  </label>

                  <div className="text-right">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsForgotPassword(true);
                        setIsPasswordMode(false);
                        setIsRegisterMode(false);
                      }}
                      className="text-sm font-medium text-sky-500 hover:text-sky-600"
                    >
                      Lupa kata sandi?
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                // Validate email for all flows (login, register, magic-link)
                if (!email.trim()) {
                  setEmailError("Alamat email tidak boleh kosong");
                  return;
                }

                // If in password-login mode, do not trigger the sent confirmation (placeholder)
                if (isPasswordMode) {
                  // Placeholder: handle password login flow here instead of showing email-sent card.
                  console.log("password login flow - not sending magic link");
                  return;
                }

                // In register mode we shouldn't show the success "Periksa Email Anda" card.
                if (isRegisterMode) {
                  // Placeholder: perform register flow here (e.g., call API). Do not set isSent.
                  console.log(
                    "register flow - email provided, proceed with register API"
                  );
                  return;
                }

                // Clear error and set sent state (used for magic-link login only)
                setEmailError("");
                setIsSent(true);
              }}
              className="w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              {isForgotPassword
                ? "Kirim email"
                : isRegisterMode
                ? "Daftar dengan email"
                : isPasswordMode
                ? "Masuk"
                : "Kirim link"}
            </button>

            <div
              className={`grid transition-all duration-500 ease-in-out ${
                isForgotPassword ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-black">
                    <span className="h-px flex-1 bg-black" />
                    or
                    <span className="h-px flex-1 bg-black" />
                  </div>

                  <div className="space-y-3">
                    {/* Animate the password-login toggle so it slides out when entering Register mode */}
                    <div
                      className={`grid transition-all duration-500 ease-in-out ${
                        !isRegisterMode ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <ButtonWithIcon
                          onClick={() => {
                            setIsPasswordMode((s) => !s);
                            setIsForgotPassword(false);
                            setIsRegisterMode(false);
                          }}
                          icon={
                            isPasswordMode ? (
                              <FontAwesomeIcon
                                icon={faEnvelope}
                                className="h-5 w-5 text-slate-400"
                              />
                            ) : (
                              <FontAwesomeIcon
                                icon={faKey}
                                className="h-5 w-5 text-slate-400"
                              />
                            )
                          }
                        >
                          {isPasswordMode
                            ? "Kirim link login melalui email"
                            : "Masuk dengan kata sandi"}
                        </ButtonWithIcon>
                      </div>
                    </div>

                    <ButtonWithIcon
                      icon={
                        <FontAwesomeIcon
                          icon={faGoogle}
                          className="h-5 w-5 text-slate-500"
                        />
                      }
                    >
                      Masuk dengan Google
                    </ButtonWithIcon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonWithIcon({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
    >
      {icon}
      {children}
    </button>
  );
}

export default App;
