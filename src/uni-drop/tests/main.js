import playwright from "playwright";
import { program } from 'commander';


program
  .option('--url <url>', "the url of frontend", "http://localhost:5173")
program.parse();
const url = program.opts()['url']

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertOne(array) {
  assert(array.length === 1, `Expected 1 element, found ${array.length}`);
}

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();

  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await Promise.all([page1.goto(url), page2.goto(url)]);

  const [page1Id, page2Id] = await Promise.all([
    page1.locator('//*[@id="peerID"]').innerText(),
    page2.locator('//*[@id="peerID"]').innerText(),
  ]);

  await Promise.all([
    page1.getByText(page2Id).click(),
    page2.getByText(page1Id).click(),
  ]);

  const msg1 = "Hello";
  await page1.getByPlaceholder("Type message here").click();
  await page1.getByPlaceholder("Type message here").fill(msg1);
  await page1.keyboard.press("Enter");
  assertOne(await page2.getByText(msg1, { exact: true }).all());

  const msg2 = "Hi";
  await page2.getByPlaceholder("Type message here").click();
  await page2.getByPlaceholder("Type message here").fill(msg2);
  await page2.keyboard.press("Enter");
  assertOne(await page1.getByText(msg2, { exact: true }).all());

  await browser.close();
})();
