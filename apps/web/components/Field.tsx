interface FieldProps {
  label: string;
  value: string;
}

export function Field({ label, value }: FieldProps) {
  return (
    <div className="mt-3 rounded-[18px] border border-line bg-[#fbf8ef] p-4">
      <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </label>
      <strong className="block text-[18px] tracking-[-0.02em]">{value}</strong>
    </div>
  );
}
