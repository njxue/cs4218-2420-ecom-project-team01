import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import ProductDetails from "./ProductDetails";
import userEvent from "@testing-library/user-event";
import CartPage from "./CartPage";

jest.mock("axios");

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const testProductSlug = "product-slug-1";
const testRelatedProductSlug = "product-slug-2";
const renderPage = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[`/product/${testProductSlug}`]}>
            <Routes>
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

describe("Product Categories Test", () => {
  let mockProduct, mockCategories, mockRelatedProduct;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCategories = [
      { _id: "categoryId_1", name: "Book" },
      { _id: "categoryId_2", name: "Food" },
      { _id: "categoryId_3", name: "Electronics" },
    ];
    mockProduct = {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "$77.99",
      slug: testProductSlug,
      category: mockCategories[0],
    };
    mockRelatedProduct = {
      _id: "productId_2",
      name: "An expensive book",
      description: "An expensive book description",
      price: "$799.99",
      slug: testRelatedProductSlug,
      category: mockCategories[0],
    };

    axios.get.mockImplementation((url) => {
      switch (url) {
        // For categories dropdown in header
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });

        case `/api/v1/product/get-product/${mockProduct.slug}`:
          return Promise.resolve({
            data: { product: mockProduct },
          });
        case `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`:
          return Promise.resolve({
            data: { products: [mockRelatedProduct] },
          });
        // Cart page
        case "/api/v1/product/braintree/token":
          return Promise.resolve({ data: null });
      }
    });
  });

  test("should add product to cart", async () => {
    renderPage();

    // Wait for product details to load for add to cart to work
    await waitFor(() => {
      expect(screen.getByTestId("product-name")).toHaveTextContent(
        mockProduct.name
      );
    });

    const addToCartBtn = screen.getByTestId("add-to-cart-main");
    const cartLink = screen.getByRole("link", { name: /cart/i });
    await act(async () => {
      userEvent.click(addToCartBtn);
      userEvent.click(cartLink);
    });

    // Should add item to cart
    await waitFor(() => {
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });
  });

  test("should add related product to cart", async () => {
    renderPage();

    // Wait for product details to load for add to cart to work
    await waitFor(() => {
      expect(
        screen.getByTestId(`similar-product-${mockRelatedProduct._id}`)
      ).toHaveTextContent(mockRelatedProduct.name);
    });

    const addToCartBtn = screen.getByTestId(
      `add-to-cart-${mockRelatedProduct._id}`
    );
    const cartLink = screen.getByRole("link", { name: /cart/i });

    await act(async () => {
      userEvent.click(addToCartBtn);
      userEvent.click(cartLink);
    });

    // Should add item to cart
    await waitFor(() => {
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });
  });
});
