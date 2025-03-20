import React from "react";
import { render, screen, act, within, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";
import Search from "./Search";
import ProductDetails from "./ProductDetails";
import CartPage from "./CartPage";

jest.mock("axios");

// Loading /search page wont trigger fetch until search button is clicked, so we render from homepage
const renderHomePage = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<Search />} />
              <Route path="/product/:slug" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

const goToSearchPage = async (keyword) => {
  renderHomePage();
  await act(async () => {
    userEvent.type(screen.getByPlaceholderText(/search/i), keyword);
    userEvent.click(screen.getByRole("button", { name: /search/i }));
  });
};

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

describe("Search Product Test", () => {
  let mockProduct, testKeyword;

  beforeEach(() => {
    jest.clearAllMocks();

    testKeyword = "book";
    mockProduct = {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "$77.99",
      slug: "nice-book",
      category: "book",
    };

    axios.get.mockImplementation((url) => {
      switch (url) {
        // For categories dropdown in header
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        // For getting products in homepage
        case "/api/v1/product/product-list/1":
          return Promise.resolve({
            data: [mockProduct],
          }); // For product details page
        case `/api/v1/product/get-product/${mockProduct.slug}`:
          return Promise.resolve({
            data: { product: mockProduct },
          });
        case `/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`:
          return Promise.resolve({
            data: { products: [] },
          });
        case "/api/v1/product/product-count":
          return Promise.resolve({ data: { total: 1 } });
        // For /search page
        case `/api/v1/product/search/${testKeyword}`:
          return Promise.resolve({
            data: [mockProduct],
          });
        // Cart page
        case "/api/v1/product/braintree/token":
          return Promise.resolve({ data: null });
      }
    });
  });

  test("should search product from home page", async () => {
    renderHomePage();

    act(() => {
      userEvent.type(screen.getByPlaceholderText(/search/i), testKeyword);
      userEvent.click(screen.getByRole("button", { name: /search/i }));
    });
    const productCard = await screen.findByTestId(`product-${mockProduct._id}`);

    expect(
      screen.getByRole("heading", { name: /search results/i })
    ).toBeInTheDocument();
    expect(productCard).toBeInTheDocument();
    expect(within(productCard).getByText(mockProduct.name)).toBeInTheDocument();
    expect(
      within(productCard).getByText(`$ ${mockProduct.price}`)
    ).toBeInTheDocument();
    expect(
      within(productCard).getByText(`${mockProduct.description}...`)
    ).toBeInTheDocument();
  });

  test("should add product to cart", async () => {
    await goToSearchPage(testKeyword);

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

  test("clicking on 'More Details' should navigate user to product's product details page", async () => {
    await goToSearchPage(testKeyword);

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
});
