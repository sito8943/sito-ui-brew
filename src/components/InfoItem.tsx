import React from "react";

type Props = {
  label: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
  children?: React.ReactNode; // alternative to value
};

export default function InfoItem({ label, value, className = "", children }: Props) {
  return (
    <div className={`flex flex-col border border-gray-200 rounded-md px-3 py-2 ${className}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm break-words">{value ?? children ?? "—"}</div>
    </div>
  );
}

