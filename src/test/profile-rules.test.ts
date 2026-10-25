import { describe, expect, it } from "vitest";
import { emptyProfile, profileSchema, assertProfileEditor } from "@/lib/profile-rules";

describe("reporter registration", () => {
  it("requires staff number and department for UiTM staff", () => {
    expect(profileSchema.safeParse({ ...emptyProfile, staff_name: "Staf", staff_id: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...emptyProfile, staff_name: "Staf", staff_id: "184523", department: "BPF" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...emptyProfile, staff_name: "Staf", staff_id: "184523", department: "" }).success).toBe(false);
  });
  it("requires contractor company but permits optional phone and scope", () => {
    expect(profileSchema.safeParse({ ...emptyProfile, user_type: "contractor", staff_name: "Wakil" }).success).toBe(false);
    const parsed = profileSchema.parse({ ...emptyProfile, user_type: "contractor", staff_name: "Wakil", company_name: " Mega Bina ", staff_id: "old" });
    expect(parsed.company_name).toBe("Mega Bina"); expect(parsed.staff_id).toBe(""); expect(parsed.main_scope_id).toBeNull();
  });
  it("does not grant admin privileges from reporter type", () => {
    expect(() => assertProfileEditor("other", "self", false)).toThrow();
    expect(() => assertProfileEditor("self", "self", false)).not.toThrow();
    expect(() => assertProfileEditor("other", "admin", true)).not.toThrow();
  });
});