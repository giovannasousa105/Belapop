"use client";

type PageHeadingProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export const PageHeading = ({ title, subtitle, className }: PageHeadingProps) => {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <h1 className="font-display text-3xl text-noir-950">{title}</h1>
      <p className="text-sm text-noir-600">{subtitle}</p>
    </div>
  );
};
