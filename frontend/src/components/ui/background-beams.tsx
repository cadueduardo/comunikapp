"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-full z-0",
        className
      )}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-transparent z-10"></div>
      <div className="absolute inset-0 h-full w-full bg-gradient-to-t from-black via-black to-transparent z-0"></div>
    </div>
  );
}; 