"use client";

import { SkinScanSummaryCard } from "@/components/customer/SkinScanSummaryCard";
import SkincareRoutineExperience from "@/components/customer/SkincareRoutineExperience";

export const dynamic = "force-dynamic";

export default function ContaSkincarePage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-5 pb-4 pt-8 sm:px-8">
        <SkinScanSummaryCard />
      </div>
      <SkincareRoutineExperience />
    </>
  );
}
