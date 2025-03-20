import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SearchInput from "./SearchInput";
import { SearchProvider } from "../../context/search";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import Search from "../../pages/Search";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";

jest.mock("axios");

describe("Search Input Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should search products and navigate to product search page on submit when search term is provided", async () => {
    const testKeyword = "test keyword";
    axios.get.mockResolvedValue({ data: [] });

    render(
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <MemoryRouter initialEntries={["/"]}>
              <Routes>
                <Route path="/" element={<SearchInput />} />
                <Route path="/search" element={<Search />} />
              </Routes>
            </MemoryRouter>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    );

    act(() => {
      userEvent.type(screen.getByPlaceholderText(/search/i), testKeyword);
    });
    userEvent.click(screen.getByRole("button", { name: /search/i }));

    // should navigate to /search
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /search results/i })
      ).toBeInTheDocument();
    });
    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/search/${testKeyword}`
    );
  });
});
