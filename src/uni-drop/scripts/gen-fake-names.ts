import { faker } from "@faker-js/faker/locale/en_US";

const namesSet = new Set<string>();

const nums = 1024;

// max faker.js can generate is 3005

while (namesSet.size < nums) {
  console.log(`Generating ${namesSet.size} of ${nums}`);
  namesSet.add(faker.person.firstName());
}

import { writeFileSync } from "fs";
writeFileSync(
  "./src/utils/fake-names.json",
  JSON.stringify([...namesSet], null, 0),
);
