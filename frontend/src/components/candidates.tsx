import type { StoredJob } from "../types/jobs";

type CandidatesProps = {
  job: StoredJob;
};

const COLUMN_HEADERS = [
  { key: "name", label: "Nama Lengkap" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone Numbers" },
  { key: "dob", label: "Date of Birth" },
  { key: "domicile", label: "Domicile" },
  { key: "gender", label: "Gender" },
  { key: "linkedin", label: "Link LinkedIn" },
];

function Candidates({ job }: CandidatesProps) {
  const jobTitle =
    job.formValues.jobName?.trim() ||
    "Untitled Job";

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {jobTitle}
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar-thin">
          <table className="min-w-[960px] w-full table-fixed border-collapse text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-14 px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all candidates"
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </th>
                {COLUMN_HEADERS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-4 py-4 text-left font-semibold"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                <td colSpan={COLUMN_HEADERS.length + 1} className="px-4 py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-600">
                      Belum ada kandidat
                    </span>
                    <span className="text-center text-xs">
                      Kandidat yang melamar akan muncul di tabel ini secara
                      otomatis.
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Candidates;
