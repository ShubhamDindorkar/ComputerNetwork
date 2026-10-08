import { blankTopology } from "./blank";
import { campusQoSCabledOnly, campusQoSPreset } from "./campusQoS";
import type { Topology } from "../types";

export const PRESETS: Record<string, () => Topology> = {
  blank: blankTopology,
  "campus-cabled": campusQoSCabledOnly,
  "campus-qos": campusQoSPreset,
};

export function listPresets() {
  return [
    { id: "blank", name: "Blank canvas", description: "Empty project" },
    {
      id: "campus-cabled",
      name: "Campus (cabled only)",
      description: "12 devices and 11 links, no IP/services",
    },
    {
      id: "campus-qos",
      name: "Campus_Network_QoS_Project",
      description: "Full reference build from the lab guide",
    },
  ];
}
