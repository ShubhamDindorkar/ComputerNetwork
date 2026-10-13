"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";

interface CliTab {
  label: string;
  device: string;
  prompt: string;
  output: string;
  desc: string;
}

const TABS: CliTab[] = [
  {
    label: "ping 192.168.1.20",
    device: "PC-A1",
    prompt: "C:\\> ping 192.168.1.20",
    output: `Pinging 192.168.1.20 with 32 bytes of data:
Reply from 192.168.1.20: bytes=32 time=4ms TTL=127
Reply from 192.168.1.20: bytes=32 time=3ms TTL=127
Reply from 192.168.1.20: bytes=32 time=3ms TTL=127
Reply from 192.168.1.20: bytes=32 time=4ms TTL=127

Ping statistics for 192.168.1.20:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)
Approximate round trip times in milli-seconds:
    Minimum = 3ms, Maximum = 4ms, Average = 3ms`,
    desc: "Verifies cross-subnet ICMP reachability: PC-A1 (192.168.0.20) → PC-B1 (192.168.1.20) via Core-Router LPM.",
  },
  {
    label: "nslookup campus.local",
    device: "PC-A1",
    prompt: "C:\\> nslookup campus.local",
    output: `Server:  192.168.0.11
Address: 192.168.0.11

Name:    campus.local
Address: 192.168.2.10`,
    desc: "Queries DNS-Server (192.168.0.11) via UDP port 53 to resolve the campus web intranet A-record.",
  },
  {
    label: "ipconfig /all",
    device: "PC-A1",
    prompt: "C:\\> ipconfig /all",
    output: `Windows IP Configuration

Ethernet adapter Local Area Connection:
   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.0.20
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.0.1
   DNS Servers . . . . . . . . . . . : 192.168.0.11
   DHCP Enabled. . . . . . . . . . . : Yes`,
    desc: "Displays the dynamic lease acquired via DORA from DHCP-Server (192.168.0.10), including gateway and DNS.",
  },
  {
    label: "show ip route",
    device: "Core-Router",
    prompt: "Core-Router# show ip route",
    output: `Codes: C - connected, O - OSPF

Gateway of last resort is not set

C    192.168.0.0/24 is directly connected, GigabitEthernet0/0
C    192.168.1.0/24 is directly connected, GigabitEthernet0/1
C    192.168.2.0/24 is directly connected, GigabitEthernet0/2
O    OSPF process 1 enabled (single-router: no learned routes)`,
    desc: "Displays the routing table: three directly connected /24 subnets and OSPF process status.",
  },
  {
    label: "show policy-map",
    device: "Core-Router",
    prompt: "Core-Router# show policy-map\nCore-Router# show policy-map interface",
    output: `Policy Map Campus-QoS-Policy
  Class DHCP-DNS: priority 3, bandwidth 50%
  Class Web-Traffic: priority 2, bandwidth 30%
  Class Default-Traffic: priority 1, bandwidth 20%

Gi0/0 out: Campus-QoS-Policy
Gi0/1 out: Campus-QoS-Policy
Gi0/2 out: Campus-QoS-Policy`,
    desc: "Shows active CBWFQ policy map and service-policy application to all three router egress interfaces.",
  },
];

export function CliShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const active = TABS[activeIdx];

  const copyAll = () => {
    void navigator.clipboard.writeText(`${active.prompt}\n${active.output}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-[var(--muted)]" />
          <h2 className="text-xl font-normal text-[var(--foreground)]">CLI Diagnostics</h2>
        </div>
        <p className="text-sm text-[var(--muted)] mt-1">
          Packet Tracer-compatible PC command prompt and Cisco IOS router verification commands
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={`rounded border px-3 py-1.5 text-xs font-mono transition ${
              activeIdx === i
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Terminal window */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--subtle)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            <span className="ml-3 text-xs font-mono text-[var(--muted)]">{active.device}</span>
          </div>
          <button
            type="button"
            onClick={copyAll}
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            {copied
              ? <><Check className="h-3 w-3 text-emerald-600" /> Copied</>
              : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </div>

        {/* Terminal body */}
        <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto">
          <div className="text-emerald-700 font-semibold mb-1.5 whitespace-pre">{active.prompt}</div>
          <pre className="text-[var(--foreground)] whitespace-pre">{active.output}</pre>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] italic">{active.desc}</p>
    </div>
  );
}
