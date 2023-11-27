import { Browser, Page, chromium } from "playwright";
import { program } from "commander";
import * as fs from "fs";
import { exit } from "process";

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

class TestCase {
  constructor(
    public name: string,
    public func: (browser: Browser) => Promise<void>,
    private config: Map<string, string> = new Map(),
    public timeout: number = 10000,
  ) {}

  async run() {
    const browser = await chromium.launch({
      headless: false,
    });
    try {
      console.log(`Running test case: ${this.name}`);

      let configText = "";
      for (const [key, value] of this.config) {
        configText += `${key}=${value}\n`;
      }
      await fs.promises.writeFile(".env.development.local", configText);

      await this.func(browser);
      console.log(`Test case ${this.name} passed`);
    } catch (error) {
      console.log(`Test case ${this.name} failed`);
      console.log(error);
      exit(1);
    } finally {
      browser.close();
    }
  }
}

async function getInnerText(page: Page, selector: string) {
  for (let i = 0; i < 10; i++) {
    const element = page.locator(selector);
    if (element) {
      return element.innerText();
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Could not get innerText of ${selector}`);
}

async function getPeerName(page: Page) {
  return getInnerText(page, '//*[@id="peerName"]');
}

async function getPeerID(page: Page) {
  return getInnerText(page, '//*[@id="peerID"]');
}

async function sendMsg(page: Page, msg: string) {
  await page.getByPlaceholder("Type message here").click();
  await page.getByPlaceholder("Type message here").fill(msg);
  await page.keyboard.press("Enter");
}

async function testBasic(browser: Browser) {
  const context = await browser.newContext();

  const page1 = await context.newPage();
  const page2 = await context.newPage();
  await Promise.all([page1.goto(url), page2.goto(url)]);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const [page1Name, page2Name] = await Promise.all([
    getPeerName(page1),
    getPeerName(page2),
  ]);

  if (page1Name === "" || page2Name === "") {
    throw new Error("Could not get peer Names");
  }

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  const msg1 = "Hello";
  await sendMsg(page1, msg1);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page2.getByText(msg1, { exact: true }).all());

  const msg2 = "Hi";
  await sendMsg(page2, msg2);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page1.getByText(msg2, { exact: true }).all());
}

async function testAddPeerID(browser: Browser) {
  const context = await browser.newContext();

  const page1 = await context.newPage();
  const page2 = await context.newPage();
  await Promise.all([page1.goto(url), page2.goto(url)]);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const [page1Id, page2Id] = await Promise.all([
    getPeerID(page1),
    getPeerID(page2),
  ]);

  if (page1Id === "" || page2Id === "") {
    throw new Error("Could not get peer IDs");
  }

  console.log(`page1Id = ${page1Id}, page2Id = ${page2Id}`);

  await page1.getByText("Add").click();
  await page1.getByPlaceholder("Add friend by peer id").click();
  await page1.getByPlaceholder("Add friend by peer id").fill(page2Id);
  await page1.getByText("AddFriendByID").click();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const [page1Name, page2Name] = await Promise.all([
    getPeerName(page1),
    getPeerName(page2),
  ]);

  if (page1Name === "" || page2Name === "") {
    throw new Error("Could not get peer Names");
  }

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  const msg1 = "Hello";
  await sendMsg(page1, msg1);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page2.getByText(msg1, { exact: true }).all());

  const msg2 = "Hi";
  await sendMsg(page2, msg2);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assertOne(await page1.getByText(msg2, { exact: true }).all());
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

  const cases = [
    new TestCase("Basic", testBasic),
    new TestCase(
      "AddPeerID",
      testAddPeerID,
      new Map([["VITE_DISABLE_HEARTBEAT", "true"]]),
    ),
  ];
  for (const c of cases) {
    await c.run();
  }

  try {
    await fs.promises.rename(
      ".env.development.local.backup",
      ".env.development.local",
    );
  } catch (error) {
    console.log(error);
  }
})();
