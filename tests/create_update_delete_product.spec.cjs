import { test, expect } from "@playwright/test";

const getNameField = (page) =>
  page.getByRole("textbox", { name: "write a name" });
const getDescriptionField = (page) =>
  page.getByRole("textbox", { name: "write a description" });
const getPriceField = (page) => page.getByPlaceholder("write a Price");
const getQuantityField = (page) => page.getByPlaceholder("write a quantity");
const getUploadPhotoField = (page) => page.getByText("Upload Photo");
const getCategoryField = (page) => page.locator("#rc_select_0");
const getShippingField = (page) => page.locator("#rc_select_1");

test.describe.serial("Create, update and delete product", () => {
  const uniqueId =
    (Date.now() % 1e8).toString(36) +
    Math.random().toString(36).substring(2, 4);
  const PRODUCT_DETAILS = {
    name: `${uniqueId} Corgi t-shirt`,
    description: `${uniqueId} A cute t-shirt`,
    category: "Clothing",
    price: "59.99",
    quantity: "10",
    shipping: "No",
    photo: "corgi-tshirt.jpg",
  };

  const UPDATED_PRODUCT_DETAILS = {
    name: `${uniqueId} To Kill A Mockingbird`,
    description: `${uniqueId} To Kill A Mockingbird by Harper Lee`,
    category: "Book",
    price: "10.99",
    quantity: "100",
    shipping: "Yes",
    photo: "to-kill-a-mockingbird.jpg",
  };
  test("should create product successfully", async ({ page }) => {
    await page.goto("/dashboard/admin/create-product");

    await getCategoryField(page).click();
    await page.getByTitle(PRODUCT_DETAILS.category).click();

    await getUploadPhotoField(page).click();
    await getUploadPhotoField(page).setInputFiles(
      `tests/assets/${PRODUCT_DETAILS.photo}`
    );

    await getNameField(page).click();
    await getNameField(page).fill(PRODUCT_DETAILS.name);

    await getDescriptionField(page).click();
    await getDescriptionField(page).fill(PRODUCT_DETAILS.description);

    await getPriceField(page).click();
    await getPriceField(page).fill(PRODUCT_DETAILS.price);

    await getQuantityField(page).click();
    await getQuantityField(page).fill(PRODUCT_DETAILS.quantity);

    await getShippingField(page).click();
    await page.getByText(PRODUCT_DETAILS.shipping).click();

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    // ========================== /dashboard/admin/products ==========================
    // Should navigate to products list
    await expect(page.getByText("All Products List")).toBeVisible();
    // Should display product name and description
    await expect(
      page.getByRole("heading", { name: PRODUCT_DETAILS.name })
    ).toBeVisible();
    await expect(page.getByText(PRODUCT_DETAILS.description)).toBeVisible();

    await page.getByRole("heading", { name: PRODUCT_DETAILS.name }).click();

    // ========================== /dashboard/admin/product/:slug ==========================
    // Should populate fields with correct product details
    await expect(page.getByTitle(PRODUCT_DETAILS.category)).toBeVisible();
    await expect(getNameField(page)).toHaveValue(PRODUCT_DETAILS.name);
    await expect(getDescriptionField(page)).toHaveValue(
      PRODUCT_DETAILS.description
    );
    await expect(getPriceField(page)).toHaveValue(PRODUCT_DETAILS.price);
    await expect(getQuantityField(page)).toHaveValue(PRODUCT_DETAILS.quantity);
    await expect(page.getByTitle(PRODUCT_DETAILS.category)).toBeVisible();
    await expect(page.getByText(PRODUCT_DETAILS.shipping)).toBeVisible();

    // ========================== / (public products page) ==========================
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: PRODUCT_DETAILS.name })
    ).toBeVisible();
  });

  test("should update product successfully", async ({ page }) => {
    await page.goto("/dashboard/admin/products");
    await page.getByRole("heading", { name: PRODUCT_DETAILS.name }).click();

    // Wait for product details to load
    await expect(getNameField(page)).toHaveValue(PRODUCT_DETAILS.name);

    // Update fields
    await page.getByTitle(PRODUCT_DETAILS.category).click();
    await page.getByTitle(UPDATED_PRODUCT_DETAILS.category).click();

    await getUploadPhotoField(page).click();
    await getUploadPhotoField(page).setInputFiles(
      `tests/assets/${UPDATED_PRODUCT_DETAILS.photo}`
    );

    await getNameField(page).click();
    await getNameField(page).fill(UPDATED_PRODUCT_DETAILS.name);

    await getDescriptionField(page).click();
    await getDescriptionField(page).fill(UPDATED_PRODUCT_DETAILS.description);

    await getPriceField(page).click();
    await getPriceField(page).fill(UPDATED_PRODUCT_DETAILS.price);

    await getQuantityField(page).click();
    await getQuantityField(page).fill(UPDATED_PRODUCT_DETAILS.quantity);

    await page.getByText(PRODUCT_DETAILS.shipping).click();
    await page.getByText(UPDATED_PRODUCT_DETAILS.shipping).click();

    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    // ========================== /dashboard/admin/products ==========================
    // Should navigate to products list
    await expect(page.getByText("All Products List")).toBeVisible();

    // Should display updated product name and description
    await expect(
      page.getByRole("heading", { name: UPDATED_PRODUCT_DETAILS.name })
    ).toBeVisible();
    await expect(
      page.getByText(UPDATED_PRODUCT_DETAILS.description)
    ).toBeVisible();

    await page
      .getByRole("heading", { name: UPDATED_PRODUCT_DETAILS.name })
      .click();

    // ========================== /dashboard/admin/product/:slug ==========================
    // Should populate fields with correct product details
    await expect(
      page.getByTitle(UPDATED_PRODUCT_DETAILS.category)
    ).toBeVisible();
    await expect(getNameField(page)).toHaveValue(UPDATED_PRODUCT_DETAILS.name);
    await expect(getDescriptionField(page)).toHaveValue(
      UPDATED_PRODUCT_DETAILS.description
    );
    await expect(getPriceField(page)).toHaveValue(
      UPDATED_PRODUCT_DETAILS.price
    );
    await expect(getQuantityField(page)).toHaveValue(
      UPDATED_PRODUCT_DETAILS.quantity
    );
    await expect(
      page.getByText(UPDATED_PRODUCT_DETAILS.shipping)
    ).toBeVisible();

    // ========================== / (public products page) ==========================
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: UPDATED_PRODUCT_DETAILS.name })
    ).toBeVisible();
  });

  test("should delete product successfully", async ({ page }) => {
    await page.goto("/dashboard/admin/products");
    await page
      .getByRole("heading", { name: UPDATED_PRODUCT_DETAILS.name })
      .click();

    // Wait for product details to load
    await expect(getNameField(page)).toHaveValue(UPDATED_PRODUCT_DETAILS.name);

    // Delete product
    page.once("dialog", async (dialog) => {
      await dialog.accept("Yes");
    });
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    // ========================== /dashboard/admin/products ==========================
    // Should navigate to products list
    await expect(page.getByText("All Products List")).toBeVisible();

    // Product should disappear from products list
    await expect(
      page.getByText(UPDATED_PRODUCT_DETAILS.name)
    ).not.toBeVisible();

    await expect(
      page.getByRole("heading", { name: UPDATED_PRODUCT_DETAILS.name })
    ).not.toBeVisible();
  });
});
