import type { Topology } from "../types";

export function blankTopology(): Topology {
  return {
    id: "blank",
    name: "Blank Project",
    devices: [],
    links: [],
    dhcpLeases: {},
  };
}
