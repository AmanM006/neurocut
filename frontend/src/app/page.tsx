"use client";

import React from "react";
import { LinearNavbar } from "@/components/LinearNavbar";
import { LinearHero } from "@/components/LinearHero";
import { LinearFeatures } from "@/components/LinearFeatures";
import { LinearBenchmarkSection } from "@/components/LinearBenchmarkSection";
import { LinearFooter } from "@/components/LinearFooter";
import { LenisProvider } from "@/components/LenisProvider";

export default function LandingPage() {
 return (
 <LenisProvider>
 <div className="min-h-screen bg-[#08090a] text-zinc-100 selection:bg-indigo-500 selection:text-white">
 <LinearNavbar />
 <main>
 <LinearHero />
 <LinearFeatures />
 <LinearBenchmarkSection />
 </main>
 <LinearFooter />
 </div>
 </LenisProvider>
 );
}
