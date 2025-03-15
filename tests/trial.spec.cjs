const { test, expect } = require("@playwright/test");

test("Navigate to Homepage", async ({ page }) => {
  // Navigate to the homepage
  await page.goto("/");

  // Verify that the homepage is loaded successfully
  const pageTitle = await page.title();
  expect(pageTitle).toContain("ALL Products - Best offers");
});
