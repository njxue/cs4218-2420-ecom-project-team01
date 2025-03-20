import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SearchInput from "./SearchInput";
import { SearchProvider, useSearch } from "../../context/search";
import { useNavigate } from "react-router-dom";
import axios from "axios";

jest.mock("axios");
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

describe("Search Input Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should update search input value on change", () => {
    const testKeyword = "test keyword";
    const mockSetValue = jest.fn();
    const mockValue = { keyword: "", results: [] };
    useSearch.mockReturnValue([mockValue, mockSetValue]);

    render(<SearchInput />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: testKeyword } });

    expect(mockSetValue).toHaveBeenCalledWith({
      ...mockValue,
      keyword: testKeyword,
    });
  });

  test("should search products and navigate to product search page on submit when search term is provided", async () => {
    const testKeyword = "test keyword";
    useSearch.mockReturnValue([
      { keyword: testKeyword, results: [] },
      jest.fn(),
    ]);
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    axios.get.mockResolvedValue({ data: [] });

    render(<SearchInput />);

    userEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });
    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/search/${testKeyword}`
    );
  });

  test("should not search products and navigate to product search page when search input is empty", async () => {
    const emptyKeyword = "  ";
    useSearch.mockReturnValue([
      { keyword: emptyKeyword, results: [] },
      jest.fn(),
    ]);
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    axios.get.mockResolvedValue({ data: [] });

    render(<SearchInput />);

    userEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(axios.get).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith("/search");
  });

  test("logs error message when search product fails", async () => {
    const testKeyword = "test keyword";
    useSearch.mockReturnValue([
      { keyword: testKeyword, results: [] },
      jest.fn(),
    ]);
    const error = new Error("Unable to search for products");
    axios.get.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<SearchInput />);
    userEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
  });
});
