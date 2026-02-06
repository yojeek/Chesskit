import { test, expect } from "@playwright/test";

test.describe("Sanity checks", () => {
  test("Analysis page loads", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Chesskit Game Analysis");
    await expect(page.locator("[data-boardid]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Load game" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Game Analysis" })
    ).toBeVisible();
  });

  test("Play page loads", async ({ page }) => {
    await page.goto("/play");

    await expect(page).toHaveTitle("Chesskit Play vs Stockfish");
    await expect(page.locator("[data-boardid]")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start game" })
    ).toBeVisible();
  });

  test("Database page loads", async ({ page }) => {
    await page.goto("/database");

    await expect(page).toHaveTitle("Chesskit Game Database");
    await expect(page.locator(".MuiDataGrid-root")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add game" })).toBeVisible();
  });

  test("PGN import and analysis", async ({ page }) => {
    await page.goto("/");

    // Open load game dialog
    await page.getByRole("button", { name: "Load game" }).click();

    // Select PGN origin
    await page.locator("#dialog-select").click();
    await page.getByRole("option", { name: "PGN" }).click();

    // Enter Scholar's Mate PGN
    const pgn = [
      '[White "Alice"]',
      '[Black "Bob"]',
      '[Result "0-1"]',
      "",
      "1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 0-1",
    ].join("\n");

    await page.getByLabel("Enter PGN here...").fill(pgn);

    // Submit
    await page.getByRole("button", { name: "Add" }).click();

    // Verify player names appear
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();

    // Verify moves panel loads
    await expect(page.locator("#moves-panel")).toBeVisible();
    await expect(page.locator("#move-1")).toBeVisible();

    // Wait for Stockfish analysis to classify moves (generous timeout)
    await expect(page.locator('img[alt="move-icon"]').first()).toBeVisible({
      timeout: 90_000,
    });
  });
});
