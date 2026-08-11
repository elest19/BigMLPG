import Modal from "./Modal";

export default function ResponsiveDetailModal({ title, onClose, details = [], footer }) {
  return (
    <Modal title={title} onClose={onClose} size="lg" footer={footer}>
      <div className="max-h-[45vh] overflow-y-auto">
        <dl className="space-y-2 text-sm ">
          {details.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 rounded-lg bg-gradient-to-br from-blue-600 to-red-600 p-3 sm:flex-row sm:items-start sm:justify-between">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-100">{item.label}</dt>
              <dd className="text-sm font-semibold text-slate-200 rounded-lg px-2 py-1 sm:text-right">
                {item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}
