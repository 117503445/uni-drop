import { Page, chromium, BrowserContext } from "playwright";
import { program } from "commander";
import * as fs from "fs";
import { exit } from "process";

program.option("--url <url>", "the url of frontend", "http://localhost:5173");
program.parse();
const url = program.opts()["url"];

fs.mkdirSync("./tests/e2e/traces", { recursive: true });
fs.mkdirSync("./tests/e2e/downloads", { recursive: true });

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function until(condition: () => Promise<boolean>, timeout = 10000) {
  const detect_times = 20;
  for (let i = 0; i < detect_times; i++) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, timeout / detect_times));
  }
  throw new Error(`Condition not satisfied`);
}

class TestCase {
  constructor(
    public name: string,
    public func: (context: BrowserContext) => Promise<void>,
    private config: Map<string, string> = new Map(),
  ) {}

  async run() {
    const browser = await chromium.launch({
      headless: false,
    });
    const context = await browser.newContext();
    // context.setDefaultTimeout(5000);

    await context.tracing.start({ screenshots: true, snapshots: true });

    try {
      console.log(`Running test case: ${this.name}`);

      let configText = "";
      for (const [key, value] of this.config) {
        configText += `${key}=${value}\n`;
      }
      await fs.promises.writeFile(".env.development.local", configText);

      await this.func(context);
      console.log(`Test case ${this.name} passed`);
    } catch (error) {
      console.log(`Test case ${this.name} failed`);
      console.log(error);
      exit(1);
    } finally {
      console.log(`Stopping tracing for ${this.name}`);
      await context.tracing.stop({
        path: `./tests/e2e/traces/${this.name}.zip`,
      });
      context.close();
      browser.close();
    }
  }
}

async function getInnerText(
  page: Page,
  selector: string,
  until_not_empty = false,
) {
  const timeout = 10000;

  const detect_times = 20;
  for (let i = 0; i < detect_times; i++) {
    const element = page.locator(selector);
    if (element) {
      const text = await element.innerText();
      if (!until_not_empty || text !== "") {
        return text;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, timeout / detect_times));
  }
  throw new Error(`Could not get innerText of ${selector}`);
}

async function getPeerName(page: Page) {
  return getInnerText(page, "#peerName", true);
}

async function getPeerID(page: Page) {
  return getInnerText(page, "#peerID", true);
}

async function sendMsg(page: Page, msg: string) {
  await page.getByPlaceholder("Type message here").click();
  await page.getByPlaceholder("Type message here").fill(msg);
  await page.keyboard.press("Enter");
}

async function getPage(context: BrowserContext) {
  const page = await context.newPage();
  for (let i = 0; i < 60; i++) {
    try {
      if (i >= 5) {
        console.log(`goto ${url}, try ${i}`);
      }
      await page.goto(url);
      const title = await page.title();
      if (title === "UniDrop") {
        return page;
      }
    } catch (error) {
      if (i >= 5) {
        console.log(
          `goto ${url}, try ${i} failed, error: ${error}, timestamp: ${new Date().toISOString()}`,
        );
      }
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Could not get page");
}

async function pagesSendText(page1: Page, page2: Page) {
  console.log("pagesSendText start");
  const msg1 = "Hello";
  await sendMsg(page1, msg1);
  await until(
    async () =>
      (await page2.getByText(msg1, { exact: true }).all()).length === 1,
  );

  const msg2 = "Hi";
  await sendMsg(page2, msg2);
  await until(
    async () =>
      (await page1.getByText(msg2, { exact: true }).all()).length === 1,
  );

  console.log("pagesSendText passed");
}

async function selectFile(page: Page, filename: string, selector: string) {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator(selector).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filename);
}

async function getPin(page: Page) {
  for (let i = 0; i < 10; i++) {
    const meta = await page.locator("#me-meta").getAttribute("test-mata");
    if (!meta) {
      throw new Error("meta not found");
    }
    // console.log(`meta = ${meta}`);

    const pin = JSON.parse(meta)["pin"];
    if (pin) {
      console.log(`pin = ${pin}`);
      return pin;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Could not get pin");
}

async function testBasic(context: BrowserContext) {
  const [page1, page2] = await Promise.all([
    getPage(context),
    getPage(context),
  ]);

  const [page1Name, page2Name] = await Promise.all([
    getPeerName(page1),
    getPeerName(page2),
  ]);

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  await pagesSendText(page1, page2);

  console.log("filetest start");
  await selectFile(page1, "./public/logo.jpg", '//*[@id="btn-file"]');
  await until(
    async () => (await page2.locator(".msg-bubble-file").count()) === 1,
  );

  // Start waiting for download before clicking. Note no await.
  const downloadPromise = page2.waitForEvent("download");
  await page2
    .getByText("logo.jpg", {
      exact: false,
    })
    .click();
  const download = await downloadPromise;

  // Wait for the download process to complete and save the downloaded file somewhere.
  await download.saveAs(
    "./tests/e2e/downloads/" + download.suggestedFilename(),
  );

  // check if the file is the same
  const logo1 = await fs.promises.readFile("./public/logo.jpg");
  const logo2 = await fs.promises.readFile(
    "./tests/e2e/downloads/" + download.suggestedFilename(),
  );
  assert(logo1.equals(logo2), "File not the same");

  console.log("imagetest start");
  await selectFile(page1, "./public/logo.jpg", '//*[@id="btn-image"]');
  await until(
    async () => (await page2.locator(".msg-bubble-image").count()) === 1,
  );
}

async function testAddPeerID(context: BrowserContext) {
  const [page1, page2] = await Promise.all([
    getPage(context),
    getPage(context),
  ]);

  const [page1Id, page2Id] = await Promise.all([
    getPeerID(page1),
    getPeerID(page2),
  ]);

  console.log(`page1Id = ${page1Id}, page2Id = ${page2Id}`);

  await page1.locator("#btn-add").click();
  await page1.getByPlaceholder("Press Enter to submit PeerID").click();
  await page1.getByPlaceholder("Press Enter to submit PeerID").fill(page2Id);
  await page1.keyboard.press("Enter");

  const [page1Name, page2Name] = await Promise.all([
    getPeerName(page1),
    getPeerName(page2),
  ]);

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  await pagesSendText(page1, page2);
}

async function testAddPin(context: BrowserContext) {
  const [page1, page2] = await Promise.all([
    getPage(context),
    getPage(context),
  ]);

  await page1.getByText("(me)").click();
  const pin = await getPin(page1);

  await page2.locator("#btn-add").click();
  await page2.getByPlaceholder("Press Enter to submit Pin").click();
  await page2.getByPlaceholder("Press Enter to submit Pin").fill(pin);
  await page2.keyboard.press("Enter");
  console.log("pin submitted");

  const [page1Name, page2Name] = await Promise.all([
    getPeerName(page1),
    getPeerName(page2),
  ]);

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  await pagesSendText(page1, page2);
}

async function testAddQRCode(context: BrowserContext) {
  const page1 = await getPage(context);

  await page1.getByText("(me)").click();

  const meta = await page1.locator("#me-meta").getAttribute("test-mata");
  if (!meta) {
    throw new Error("meta not found");
  }
  console.log(`meta = ${meta}`);

  // just use url
  // TODO: use QRCode
  const url = JSON.parse(meta)["url"];
  if (!url) {
    throw new Error("url not found");
  }

  const page2 = await context.newPage();
  await page2.goto(url);

  const [page1Name, page2Name] = await Promise.all([
    getPeerName(page1),
    getPeerName(page2),
  ]);

  console.log(`page1Name = ${page1Name}, page2Name = ${page2Name}`);

  await Promise.all([
    page1.getByText(page2Name).click(),
    page2.getByText(page1Name).click(),
  ]);

  await pagesSendText(page1, page2);
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
    new TestCase(
      "AddPin",
      testAddPin,
      new Map([["VITE_DISABLE_HEARTBEAT", "true"]]),
    ),
    new TestCase(
      "AddQRCode",
      testAddQRCode,
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
