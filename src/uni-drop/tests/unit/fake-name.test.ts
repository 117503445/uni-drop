import { expect, test } from "vitest";

import { idToName } from "../../src/utils/common";

test("idToName should always equal", () => {
  const cases = [
    "c4b6ca37-2012-48ca-ace7-966c0667a2e7",
    "e4b6ca37-2012-48ca-ace7-966c0667a2e7",
  ];
  cases.forEach((id) => {
    expect(idToName(id)).toBe(idToName(id));
  });
});
