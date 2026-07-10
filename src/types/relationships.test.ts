import { describe, expect, it } from "vitest";
import {
  getRelationshipDisplayLabel,
  getRelationshipDisplayState,
  type RelationshipStatus
} from "@/types/relationships";

describe("relationship qualitative display state", () => {
  it.each<[RelationshipStatus, string]>([
    ["suggested", "Suggested"],
    ["supported", "Supported"],
    ["confirmed", "Confirmed"],
    ["corrected", "Confirmed"],
    ["contradicted", "Needs review"],
    ["rejected", "Needs review"],
    ["outdated", "Past"],
    ["archived", "Archived"]
  ])("maps %s without exposing raw confidence", (status, label) => {
    expect(getRelationshipDisplayLabel(getRelationshipDisplayState(status))).toBe(label);
  });
});
