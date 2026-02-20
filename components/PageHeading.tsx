"use client";

type PageHeadingProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export const PageHeading = ({ title, subtitle, className }: PageHeadingProps) => {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <h1 className="font-display text-3xl text-bpBlack">{title}</h1>
      <p className="text-sm text-bpGraphite/80">{subtitle}</p>
    </div>
  );
};
