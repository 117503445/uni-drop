import { chromium } from "playwright";
import { program } from "commander";
import * as fs from "fs";

program.option("--url <url>", "the url of frontend", "http://localhost:5173");
program.parse();
const url = program.opts()["url"];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

interface Lengthable {
  length: number;
}

function assertOne(array: Lengthable) {
  assert(array.length === 1, `Expected 1 element, found ${array.length}`);
}

async function testBasic() {
  console.log("Testing basic functionality");
  await fs.promises.writeFile(".env.development.local", "");

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await Promise.all([page1.goto(url), page2.goto(url)]);

  let page1Name = "";
  let page2Name = "";

  for (let i = 0; i < 10; i++) {
    const [id1, id2] = await Promise.all([
      page1.locator('//*[@id="peerName"]').innerText(),
      page2.locator('//*[@id="peerName"]').innerText(),
    ]);
    if (id1 !== "" && id2 !== "") {
      page1Name = id1;
      page2Name = id2;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (page1Name === "" || page2Name === "") {
    throw new Error("Could not get peer Names");
  }

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  const msg1 = "Hello";
  await page1.getByPlaceholder("Type message here").click();
  await page1.getByPlaceholder("Type message here").fill(msg1);
  await page1.keyboard.press("Enter");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page2.getByText(msg1, { exact: true }).all());

  const msg2 = "Hi";
  await page2.getByPlaceholder("Type message here").click();
  await page2.getByPlaceholder("Type message here").fill(msg2);
  await page2.keyboard.press("Enter");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page1.getByText(msg2, { exact: true }).all());

  await browser.close();
  console.log("Basic functionality test passed");
}

async function testAddPeerID() {
  console.log("Testing add peer ID functionality");
  await fs.promises.writeFile(
    ".env.development.local",
    "VITE_DISABLE_HEARTBEAT=true",
  );

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await Promise.all([page1.goto(url), page2.goto(url)]);

  let page1Id = "";
  let page2Id = "";

  for (let i = 0; i < 10; i++) {
    const [id1, id2] = await Promise.all([
      page1.locator('//*[@id="peerID"]').innerText(),
      page2.locator('//*[@id="peerID"]').innerText(),
    ]);
    if (id1 !== "" && id2 !== "") {
      page1Id = id1;
      page2Id = id2;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (page1Id === "" || page2Id === "") {
    throw new Error("Could not get peer IDs");
  }

  console.log(`page1Id = ${page1Id}, page2Id = ${page2Id}`);

  await page1.getByText("Add").click();
  await page1.getByPlaceholder("Add friend by peer id").click();
  await page1.getByPlaceholder("Add friend by peer id").fill(page2Id);
  await page1.getByText("AddFriendByID").click();

  await new Promise((resolve) => setTimeout(resolve, 10000));

  let page1Name = "";
  let page2Name = "";
  for (let i = 0; i < 10; i++) {
    const [name1, name2] = await Promise.all([
      page1.locator('//*[@id="peerName"]').innerText(),
      page2.locator('//*[@id="peerName"]').innerText(),
    ]);
    if (name1 !== "" && name2 !== "") {
      page1Name = name1;
      page2Name = name2;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (page1Name === "" || page2Name === "") {
    throw new Error("Could not get peer Names");
  }

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  const msg1 = "Hello";
  await page1.getByPlaceholder("Type message here").click();
  await page1.getByPlaceholder("Type message here").fill(msg1);
  await page1.keyboard.press("Enter");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page2.getByText(msg1, { exact: true }).all());

  const msg2 = "Hi";
  await page2.getByPlaceholder("Type message here").click();
  await page2.getByPlaceholder("Type message here").fill(msg2);
  await page2.keyboard.press("Enter");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page1.getByText(msg2, { exact: true }).all());

  await browser.close();
  console.log("Add peer ID functionality test passed");
}

(async () => {
  if (!fs.existsSync(".env.development.local.backup")) {
    if (!fs.existsSync(".env.development.local")) {
      await fs.promises.writeFile(".env.development.local", "");
    }

    await fs.promises.rename(
      ".env.development.local",
      ".env.development.local.backup",
    );
  }

  await testBasic();
  await testAddPeerID();

  try {
    await fs.promises.rename(
      ".env.development.local.backup",
      ".env.development.local",
    );
  } catch (error) {
    console.log(error);
  }
})();
