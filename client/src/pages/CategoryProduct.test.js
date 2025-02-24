import React from "react";
import { render, screen, act, fireEvent, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import CategoryProduct from "./CategoryProduct";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));
jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));
jest.mock("../hooks/useCategory", () => jest.fn(() => []));

jest.mock("react-router-dom", () => ({
  useParams: jest.fn().mockReturnValue({ slug: "book" }),
  useNavigate: jest.fn(),
}));
jest.mock("./../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));
describe("Product Categories Component", () => {
  const mockCategory = {
    _id: "categoryId_1",
    name: "book",
  };
  const mockProducts = [
    {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "$77.99",
      slug: "product-slug-1",
      category: mockCategory,
    },
    {
      _id: "productId_2",
      name: "Cool book",
      description: "A cool book description",
      price: "$87.99",
      slug: "product-slug-2",
      category: mockCategory,
    },
    {
      _id: "productId_3",
      name: "Funny book",
      description: "A Funny book description",
      price: "$97.99",
      slug: "product-slug-3",
      category: mockCategory,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        products: mockProducts,
        category: mockCategory,
      },
    });
  });

  test("renders products", async () => {
    render(<CategoryProduct />);
    const renderedProducts = await screen.findAllByTestId(/^product-/);

    expect(renderedProducts).toHaveLength(mockProducts.length);
    mockProducts.forEach((product) => {
      const productCard = screen.getByTestId(`product-${product._id}`);
      expect(productCard).toBeInTheDocument();
      expect(within(productCard).getByText(product.name)).toBeInTheDocument();
      expect(
        within(productCard).getByText(`${product.price}`)
      ).toBeInTheDocument();
      expect(
        within(productCard).getByText(`${product.description}...`)
      ).toBeInTheDocument();
    });
  });

  test("renders correct category and number of products found", async () => {
    render(<CategoryProduct />);

    expect(await screen.findByText(/Category - book/i)).toBeInTheDocument();
    expect(await screen.findByText(/3 result found/i)).toBeInTheDocument();
  });

  test("clicking on more details navigates user to product's details page", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<CategoryProduct />);
    const productCard = await screen.findByTestId(
      `product-${mockProducts[0]._id}`
    );
    const moreDetailsButton = within(productCard).getByRole("button", {
      name: /More Details/i,
    });

    fireEvent.click(moreDetailsButton);

    expect(moreDetailsButton).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      `/product/${mockProducts[0].slug}`
    );
  });

  test("renders no products when no products are found", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        products: [],
        category: mockCategory,
      },
    });
    const params = useParams();

    render(<CategoryProduct />);

    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/product-category/${params.slug}`
    );
    expect(await screen.findByText(/Category -/i)).toBeInTheDocument();
    expect(await screen.findByText(/0 result found/i)).toBeInTheDocument();
  });

  test("adds product to cart on click add to cart", async () => {
    const mockSetCart = jest.fn();
    const mockCart = [];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    render(<CategoryProduct />);
    const productCard = await screen.findByTestId(
      `product-${mockProducts[0]._id}`
    );
    const addToCartButton = within(productCard).getByRole("button", {
      name: /ADD TO CART/i,
    });
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("adds duplicate product to cart if product already in cart", async () => {
    const mockSetCart = jest.fn();
    const mockCart = [mockProducts[0]];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    render(<CategoryProduct />);
    const productCard = await screen.findByTestId(
      `product-${mockProducts[0]._id}`
    );
    const addToCartButton = within(productCard).getByRole("button", {
      name: /ADD TO CART/i,
    });
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("logs error message when fetching products fails", async () => {
    const error = new Error("Unable to fetch products");
    axios.get.mockRejectedValueOnce(error);
    const params = useParams();
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await act(async () => render(<CategoryProduct />));

    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/product-category/${params.slug}`
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });

  test("does not fetch products if slug is not provided", () => {
    useParams.mockReturnValueOnce(null);

    render(<CategoryProduct />);

    expect(axios.get).not.toHaveBeenCalled();
  });
});
