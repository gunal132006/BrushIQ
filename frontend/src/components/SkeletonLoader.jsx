import React from 'react';

// Main pulsing wrapper
const SkeletonPulse = ({ children }) => (
  <div className="animate-pulse space-y-4 w-full">
    {children}
  </div>
);

// 1. Dashboard Skeleton
export const DashboardSkeleton = () => {
  return (
    <SkeletonPulse>
      {/* Top Banner Skeleton */}
      <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
      
      {/* 2x2 Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
      </div>

      {/* Title & List Row skeletons */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded-md w-1/3" />
        <div className="space-y-2.5">
          <div className="h-14 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
          <div className="h-14 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        </div>
      </div>
    </SkeletonPulse>
  );
};

// 2. Family Members list skeleton
export const FamilyMembersSkeleton = () => {
  return (
    <SkeletonPulse>
      {/* Overview stats block */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="h-16 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-16 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-16 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-16 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
      </div>

      {/* Members list items */}
      <div className="space-y-2.5">
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
      </div>
    </SkeletonPulse>
  );
};

// 3. Grid / Toothbrush inventory skeleton
export const ToothbrushSkeleton = () => {
  return (
    <SkeletonPulse>
      <div className="flex justify-between items-center px-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded-md w-1/4" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800/50 rounded-lg w-20" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
      </div>
    </SkeletonPulse>
  );
};

// 4. Oral Care Tips skeleton
export const TipsSkeleton = () => {
  return (
    <SkeletonPulse>
      {/* Search Input Skeleton */}
      <div className="h-9 bg-slate-200 dark:bg-slate-800/60 rounded-xl w-full" />

      {/* Tabs Row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="h-7 bg-slate-200 dark:bg-slate-800/60 rounded-full w-14 shrink-0" />
        <div className="h-7 bg-slate-200 dark:bg-slate-800/60 rounded-full w-24 shrink-0" />
        <div className="h-7 bg-slate-200 dark:bg-slate-800/60 rounded-full w-28 shrink-0" />
        <div className="h-7 bg-slate-200 dark:bg-slate-800/60 rounded-full w-24 shrink-0" />
      </div>

      {/* Tips Cards */}
      <div className="space-y-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
      </div>
    </SkeletonPulse>
  );
};
