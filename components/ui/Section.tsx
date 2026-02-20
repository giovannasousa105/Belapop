import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({ children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`py-12 md:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">{children}</div>
    </section>
  );
}
