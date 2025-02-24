import React from "react";
import { render, screen, act, fireEvent, within } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import ProductDetails from "./ProductDetails";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";

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
  useParams: jest.fn().mockReturnValue({ slug: "test-slug" }),
  useNavigate: jest.fn(),
}));
jest.mock("./../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));
describe("Product Details Component", () => {
  const mockCategory = {
    _id: "categoryId",
    name: "Cool stuff",
  };
  const mockProduct = {
    _id: "productId",
    name: "Cool product name",
    description: "A cool product description",
    price: "$7.99",
    category: mockCategory,
  };
  const similarProducts = [
    {
      _id: "productId_1",
      name: "Another cool stuff",
      description: "Another cool stuff description",
      price: "$77.99",
      slug: "product-slug-1",
      category: mockCategory,
    },
    {
      _id: "productId_2",
      name: "Some other cool stuff",
      description: "Some other cool stuff description",
      price: "$87.99",
      slug: "product-slug-2",
      category: mockCategory,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders product details and photo", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: [] } });

    render(<ProductDetails />);

    const productPhoto = await screen.findByRole("img", {
      name: /Cool product name/i,
    });
    expect(productPhoto).toBeInTheDocument();
    expect(productPhoto).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${mockProduct._id}`
    );
    expect(await screen.findByText(/Cool product name/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/A cool product description/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/\$7\.99/i)).toBeInTheDocument();
    expect(await screen.findByText(/Cool stuff/i)).toBeInTheDocument();
  });

  test("renders similar products if they exists", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: similarProducts } });

    render(<ProductDetails />);
    const renderedSimilarProducts = await screen.findAllByTestId(
      /^similar-product-/
    );

    expect(renderedSimilarProducts).toHaveLength(similarProducts.length);
    similarProducts.forEach((product) => {
      const productCard = screen.getByTestId(`similar-product-${product._id}`);
      expect(productCard).toBeInTheDocument();
      expect(within(productCard).getByText(product.name)).toBeInTheDocument();
      expect(
        within(productCard).getByText(`${product.description}...`)
      ).toBeInTheDocument();
      expect(within(productCard).getByText(product.price)).toBeInTheDocument();
      const productPhoto = within(productCard).getByRole("img", {
        name: product.name,
      });
      expect(productPhoto).toBeInTheDocument();
      expect(productPhoto).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
      );
    });
  });

  test("renders no similar products when they dont exist", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: [] } });

    await act(async () => render(<ProductDetails />));

    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/related-product/${mockProduct._id}/${mockCategory._id}`
    );
    expect(await screen.findByText(/No Similar Products/i)).toBeInTheDocument();
  });

  test("clicking on more details navigates user to similar product's details page", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: similarProducts } });
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<ProductDetails />);
    const productCard = await screen.findByTestId(
      `similar-product-${similarProducts[0]._id}`
    );
    const moreDetailsButton = within(productCard).getByRole("button", {
      name: /More Details/i,
    });
    fireEvent.click(moreDetailsButton);

    expect(moreDetailsButton).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(
      `/product/${similarProducts[0].slug}`
    );
  });

  test("adds main product to cart on click add to cart", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: [] } });
    const mockSetCart = jest.fn();
    const mockCart = [];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    await act(async () => render(<ProductDetails />));
    const addToCartButton = await screen.findByTestId("add-to-cart-main");
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProduct]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("adds duplicate main product to cart if product already in cart", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: [] } });
    const mockSetCart = jest.fn();
    const mockCart = [mockProduct];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    await act(async () => render(<ProductDetails />));
    const addToCartButton = await screen.findByTestId("add-to-cart-main");
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProduct]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("adds similar product to cart on click add to cart", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: similarProducts } });
    const mockSetCart = jest.fn();
    const mockCart = [];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    await act(async () => render(<ProductDetails />));
    const addToCartButton = await screen.findByTestId(
      `add-to-cart-${similarProducts[0]._id}`
    );
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, similarProducts[0]]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("adds duplicate similar product to cart if product already in cart", async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockResolvedValueOnce({ data: { products: similarProducts } });
    const mockSetCart = jest.fn();
    const mockCart = [similarProducts[0]];
    useCart.mockReturnValue([mockCart, mockSetCart]);

    await act(async () => render(<ProductDetails />));
    const addToCartButton = await screen.findByTestId(
      `add-to-cart-${similarProducts[0]._id}`
    );
    fireEvent.click(addToCartButton);

    expect(mockSetCart).toHaveBeenCalledWith([...mockCart, similarProducts[0]]);
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("logs error message when no product is found", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        product: null,
      },
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());
    const params = useParams();

    await act(async () => render(<ProductDetails />));

    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/get-product/${params.slug}`
    );
    expect(console.log).toHaveBeenCalledWith("No product fetched");
    expect(toast.error).toHaveBeenCalledWith("No product found");
  });

  test("does not fetch product and similar products if slug is not provided", () => {
    useParams.mockReturnValueOnce(null);

    render(<ProductDetails />);

    expect(axios.get).not.toHaveBeenCalled();
  });

  test("logs error message when fetching main product fails", async () => {
    const error = new Error("Unable to fetch product");
    axios.get.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());
    const params = useParams();

    await act(async () => render(<ProductDetails />));

    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/get-product/${params.slug}`
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });

  test("logs error message when fetching similar product fails", async () => {
    const error = new Error("Unable to fetch similar products");
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: mockProduct,
        },
      })
      .mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    await act(async () => render(<ProductDetails />));

    expect(axios.get).toHaveBeenCalledWith(
      `/api/v1/product/related-product/${mockProduct._id}/${mockCategory._id}`
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });
});
