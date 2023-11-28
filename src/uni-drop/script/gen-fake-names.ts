import { faker } from "@faker-js/faker/locale/en_US";

const namesSet = new Set<string>();

const nums = 4096;

while (namesSet.size < nums) {
  namesSet.add(faker.person.firstName());
}

import { writeFileSync } from "fs";
writeFileSync("fake-names.json", JSON.stringify([...namesSet], null, 2));
