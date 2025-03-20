import React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Search from "./Search";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));
jest.mock("./../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));
describe("Product Search Component", () => {
  const mockProducts = [
    {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "77.99",
      slug: "product-slug-1",
      category: "book",
    },
    {
      _id: "productId_2",
      name: "Cool book",
      description: "A cool book description",
      price: "87.99",
      slug: "product-slug-2",
      category: "book",
    },
    {
      _id: "productId_3",
      name: "Funny book",
      description: "A Funny book description",
      price: "97.99",
      slug: "product-slug-3",
      category: "book",
    },
  ];

  beforeEach(() => {
    useSearch.mockReturnValue([{ results: mockProducts }, jest.fn()]);
  });

  test("renders products", async () => {
    render(<Search />);
    const renderedProducts = await screen.findAllByTestId(/^product-/);

    expect(renderedProducts).toHaveLength(mockProducts.length);
    mockProducts.forEach((product) => {
      const productCard = screen.getByTestId(`product-${product._id}`);
      expect(productCard).toBeInTheDocument();
      expect(within(productCard).getByText(product.name)).toBeInTheDocument();
      expect(
        within(productCard).getByText(`$ ${product.price}`)
      ).toBeInTheDocument();
      expect(
        within(productCard).getByText(`${product.description}...`)
      ).toBeInTheDocument();
    });
  });

  test("renders correct product count", async () => {
    render(<Search />);

    expect(
      screen.getByText(`Found ${mockProducts.length}`)
    ).toBeInTheDocument();
  });

  test("renders 'No Products Found' when no products are found", async () => {
    useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

    render(<Search />);

    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  test("should add product to card", async () => {
    const mockSetCart = jest.fn();
    const mockCart = [];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    render(<Search />);

    const productCard = await screen.findByTestId(
      `product-${mockProducts[0]._id}`
    );
    const addToCartButton = within(productCard).getByRole("button", {
      name: /ADD TO CART/i,
    });
    userEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("clicking on more details navigates user to product's details page", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<Search />);
    const productCard = await screen.findByTestId(
      `product-${mockProducts[0]._id}`
    );
    const moreDetailsButton = within(productCard).getByRole("button", {
      name: /More Details/i,
    });

    userEvent.click(moreDetailsButton);

    expect(moreDetailsButton).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      `/product/${mockProducts[0].slug}`
    );
  });
});
