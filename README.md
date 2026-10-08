# Campus Network QoS Simulator

Browser-based lab companion for the **Campus Network with QoS** guide (Cisco Packet Tracer topology). Build the 12-device network, cable ports, configure IP/DHCP/DNS/HTTP/OSPF/QoS, and run simulated tests—no database; projects persist in `localStorage` and export as JSON.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Load Campus_Network_QoS_Project** for the fully configured reference topology.

## Guide mapping

| Guide part | App feature |
|------------|-------------|
| Part 3 – Devices | Device palette, drag onto canvas, rename in inspector |
| Part 4 – Cables | Copper straight-through tool, port picker (11 connections) |
| Part 5 – IP & services | Router/server/PC inspector tabs |
| Part 6 – OSPF | Router → Routing → OSPF (single-router; no SPF peers in v1) |
| Part 7 – QoS | Router → QoS → **Apply Campus-QoS-Policy preset**; QoS bottom tab |
| Part 8 – Tests | PC CLI (`ping`, `nslookup`), Web Browser, **Validate** / Checklist |
| Part 9 – Save | **Save As JSON** (Ctrl+S in workspace) |
| Part 10 – Report | **Report** → print or download Markdown |

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm test` – Vitest engine tests (reference preset)

## Architecture

- `src/engine/` – pure TypeScript simulation (L2, routing, DHCP, DNS, HTTP, QoS, validation)
- `src/app/api/` – stateless route handlers
- `src/store/` – Zustand + `localStorage`
- `src/components/` – React Flow canvas and Packet Tracer-style inspector
