type StatColor = "blue" | "green" | "red" | "amber";

const styles: Record<StatColor, string> = {
  blue: "text-blue-700",
  green: "text-emerald-700",
  red: "text-red-700",
  amber: "text-amber-700",
};

export default function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: StatColor;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-bold tabular-nums ${styles[color]}`}>
        {value.toLocaleString("he-IL")}
      </p>
    </div>
  );
}
