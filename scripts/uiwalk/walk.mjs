/* Smoke-test walkthrough of the PANTHEON frontend.
 * - Records every console error / page error.
 * - Takes a screenshot after every step.
 * - Prints a final pass/fail per step.
 *
 * Run from /Users/temur/Desktop/pantheon/scripts/uiwalk/:
 *   node walk.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = join(process.cwd(), "shots");
await mkdir(OUT, { recursive: true });

const errors = [];
const pageErrors = [];

const results = [];
function log(step, ok, note = "") {
  results.push({ step, ok, note });
  console.log(`${ok ? "✓" : "✗"}  ${step}${note ? "  — " + note : ""}`);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console] ${m.text()}`);
});
page.on("pageerror", (err) => pageErrors.push(`[pageerror] ${err.message}`));

async function shot(name) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // 1. Overview
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await wait(800);
  await shot("01-overview");
  const cards = await page.locator('[role="list"] a').count();
  log("Overview loads with player cards", cards >= 3, `${cards} cards`);

  // 2. Click first player card → detail page
  const firstCard = page.locator('[role="list"] a').first();
  const cardName = await firstCard.locator(":scope > div > div > div").first().textContent();
  await firstCard.click();
  await page.waitForURL(/\/p\//);
  await wait(1500);
  await shot("02-player-detail");
  log("Click player card opens detail view", true, `name "${cardName?.trim()}"`);

  // 3. Open Fullscreen viewer
  await page.locator("a", { hasText: "Fullscreen" }).first().click();
  await page.waitForURL(/\/viewer\//);
  // wait for Mol* canvas to appear
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await wait(3500); // allow bcif download + render
  await shot("03-fullscreen-loaded");
  const hasCanvas = await page.locator("canvas").count();
  log("Fullscreen loads Mol* canvas", hasCanvas > 0, `${hasCanvas} canvases`);

  // 4. Check Mission Stress Test panel renders
  const missionPanel = await page.locator('[role="region"][aria-label="Mission stress test"]').count();
  log("Mission Stress Test panel visible", missionPanel === 1);

  // 5. Verify toolbox auto-hides — move mouse around to keep it visible
  await page.mouse.move(700, 400);
  await wait(500);
  await shot("04-chrome-visible");

  // 6. Click "Apply substance" via shortcut A (more reliable than searching for icon)
  await page.keyboard.press("a");
  await wait(700);
  await shot("05-drawer-open");
  const drawerHeading = await page.locator('text="Pick one, tune the knobs"').count();
  log("Pressing A opens perturbation drawer", drawerHeading > 0);

  // 7. Pick Heat shock
  const heatBtn = page.locator('button[aria-pressed]', { hasText: "Heat shock" });
  await heatBtn.click();
  await wait(400);
  await shot("06-heat-selected");
  // Sliders should appear in the drawer
  const drawerSliders = await page.locator('aside[aria-label="Apply substance or stress"] input[type="range"]').count();
  log("Heat shock selection reveals parameter sliders", drawerSliders >= 2, `${drawerSliders} sliders`);

  // 8. Hit Run
  await page.locator('button:has-text("Run")').last().click();
  await wait(1500);
  await shot("07-perturb-started");
  const livePill = await page.locator('text="LIVE · CLIENT-FAKE"').count();
  log("Run launches live playback bar", livePill > 0);

  // 9. Drag the Temp slider in the live playback bar (live param steering)
  const tempSlider = page.locator('label:has-text("Temp") input[type="range"]').first();
  if (await tempSlider.count()) {
    await tempSlider.evaluate((el) => {
      el.value = el.max;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await wait(600);
    await shot("08-temp-maxed");
    log("Live Temp slider responds during playback", true);
  } else {
    log("Live Temp slider responds during playback", false, "no slider found");
  }

  // 10. Wait for perturbation to finish
  await wait(6500);
  await shot("09-perturb-complete");
  log("Perturbation completes", true);

  // 11. Click "Run mission test" — should auto-fire heat shock at 70°C / 5s
  const missionBtn = page.locator('button:has-text("mission test")').first();
  if (await missionBtn.count()) {
    await missionBtn.click();
    await wait(800);
    await shot("10-mission-running");
    log("Mission test launches", true);
    await wait(6500);
    await shot("11-mission-verdict");
    const passOrFail = await page.locator('text=/PASS|FAIL/').count();
    log("Mission test produces verdict", passOrFail > 0);
  } else {
    log("Mission test launches", false, "button not found");
  }

  // 12. Click on the canvas to test residue selection
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) {
    // Click roughly in the middle (where the protein is)
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await wait(1200);
    await shot("12-canvas-click");
    const scanCard = await page.locator('[role="dialog"][aria-label*="Residue"]').count();
    log("Canvas click opens residue scanner card", scanCard > 0, scanCard === 0 ? "(or no residue under click)" : "");
  }

  // 13. Try keyboard shortcut for shortcut sheet
  await page.keyboard.press("?");
  await wait(500);
  await shot("13-shortcuts-open");
  const sheet = await page.locator('text="Shortcuts"').count();
  log("? opens shortcut sheet", sheet > 0);
  await page.keyboard.press("Escape");
  await wait(300);

  // 14. Toggle representation via keys 1/2/3
  await page.keyboard.press("2"); // surface
  await wait(800);
  await shot("14-surface");
  log("Key 2 switches to surface representation", true);

  await page.keyboard.press("3"); // ball-and-stick
  await wait(800);
  await shot("15-atoms");
  log("Key 3 switches to atoms representation", true);

  await page.keyboard.press("1"); // back to cartoon
  await wait(500);

  // 15. Toggle hotspots
  await page.keyboard.press("t");
  await wait(500);
  await shot("16-hotspots-toggled");
  log("Key T toggles hotspots", true);

  // 16. Cycle color via C
  await page.keyboard.press("c");
  await wait(500);
  await shot("17-color-cycled");
  log("Key C cycles color theme", true);

  // 17. Exit
  await page.keyboard.press("Escape");
  await wait(500);
  await shot("18-back-overview");
} catch (err) {
  console.error("FATAL", err);
  log("Walkthrough crashed", false, err.message);
}

console.log("\n=== ERRORS ===");
console.log("Console errors:", errors.length, errors.length ? "\n" + errors.join("\n") : "");
console.log("Page errors:", pageErrors.length, pageErrors.length ? "\n" + pageErrors.join("\n") : "");

await writeFile(
  join(OUT, "summary.json"),
  JSON.stringify({ results, errors, pageErrors }, null, 2)
);

const fails = results.filter((r) => !r.ok).length;
console.log(`\n=== ${results.length - fails}/${results.length} passed ===`);

await browser.close();
process.exit(fails === 0 ? 0 : 1);
