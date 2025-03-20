import React from "react";
import { render, screen, waitFor, act, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import CategoryProduct from "./CategoryProduct";
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
const renderPage = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/category/book"]}>
            <Routes>
              <Route path="/category/:slug" element={<CategoryProduct />} />
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

describe("Product Categories Page", () => {
  let mockProduct;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProduct = {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "$77.99",
      slug: "product-slug-1",
      category: "book",
    };
    axios.get.mockImplementation((url) => {
      switch (url) {
        // For categories dropdown in header
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        case `/api/v1/product/product-category/book`:
          return Promise.resolve({
            data: { products: [mockProduct] },
          });
        // For product details page
        case `/api/v1/product/get-product/${mockProduct.slug}`:
          return Promise.resolve({
            data: { product: mockProduct },
          });
        case `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`:
          return Promise.resolve({
            data: { products: [] },
          });
        // Cart page
        case "/api/v1/product/braintree/token":
          return Promise.resolve({ data: null });
      }
    });
  });

  test("clicking on 'More Details' should navigate user to product's product details page", async () => {
    renderPage();

    const productCard = await screen.findByTestId(`product-${mockProduct._id}`);
    const moreDetailsBtn = await within(productCard).findByRole("button", {
      name: /more details/i,
    });
    act(() => {
      userEvent.click(moreDetailsBtn);
    });

    // Should navigate to product details page
    await waitFor(() => {
      expect(screen.getByText(/product details/i)).toBeInTheDocument();
      expect(screen.getByTestId("product-name")).toHaveTextContent(
        mockProduct.name
      );
    });
  });

  test("should add product to cart", async () => {
    renderPage();

    const productCard = await screen.findByTestId(`product-${mockProduct._id}`);
    const addtoCartBtn = await within(productCard).findByRole("button", {
      name: /add to cart/i,
    });
    const cartLink = await screen.findByRole("link", { name: /cart/i });

    act(() => {
      userEvent.click(addtoCartBtn);
      userEvent.click(cartLink);
    });

    // Should add item to cart
    expect(await screen.findByText(mockProduct.name)).toBeInTheDocument();
  });
});
