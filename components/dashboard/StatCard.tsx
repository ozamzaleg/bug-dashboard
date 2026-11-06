import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  color: string;
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  color,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>
      </div>

      <h2 className="mt-5 text-3xl font-bold text-slate-900">
        {value}
      </h2>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}