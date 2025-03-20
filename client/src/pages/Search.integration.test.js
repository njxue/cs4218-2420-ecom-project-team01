import React from "react";
import { render, screen, act, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import userEvent from "@testing-library/user-event";
import HomePage from "./HomePage";
import Search from "./Search";

jest.mock("axios");

const renderPage = () => {
  render(
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter initialEntries={[`/`]}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
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
          });
        case "/api/v1/product/product-count":
          return Promise.resolve({ data: { total: 1 } });
        // For /search page
        case `/api/v1/product/search/${testKeyword}`:
          return Promise.resolve({
            data: [mockProduct],
          });
      }
    });
  });

  test("should search product from home page", async () => {
    renderPage();

    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/search/i), testKeyword);
      userEvent.click(screen.getByRole("button", { name: /search/i }));
    });
    const productCard = screen.getByTestId(`product-${mockProduct._id}`);

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
});
