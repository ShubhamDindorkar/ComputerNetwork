import Link from "next/link";
import { LandingActions } from "@/components/landing/LandingActions";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">
          Computer Network Lab
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Campus Network QoS Simulator
        </h1>
        <p className="mt-4 text-slate-300 leading-relaxed">
          Build the 12-device campus topology from your lab guide, configure
          DHCP, DNS, HTTP, OSPF, and QoS, then run ping, nslookup, and web tests
          in the browser. Projects save locally and export as JSON.
        </p>
      </div>
      <LandingActions />
      <p className="text-sm text-slate-500">
        Already working?{" "}
        <Link href="/workspace" className="text-blue-400 hover:underline">
          Open workspace
        </Link>
      </p>
    </main>
  );
}
