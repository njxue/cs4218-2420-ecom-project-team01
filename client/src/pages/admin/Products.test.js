import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Products from "./Products";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

describe("Products Test", () => {
  const mockProducts = [
    {
      _id: "productId_1",
      name: "Nice book",
      description: "A nice book description",
      price: "$77.99",
      slug: "product-slug-1",
      category: {
        _id: "categoryId_1",
        name: "book",
      },
    },
    {
      _id: "productId_2",
      name: "Cool book",
      description: "A cool book description",
      price: "$87.99",
      slug: "product-slug-2",
      category: {
        _id: "categoryId_1",
        name: "book",
      },
    },
    {
      _id: "productId_3",
      name: "Funny book",
      description: "A Funny book description",
      price: "$97.99",
      slug: "product-slug-3",
      category: {
        _id: "categoryId_1",
        name: "book",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders products", async () => {
    axios.get.mockResolvedValue({
      data: { products: mockProducts },
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );
    const productLinks = await screen.findAllByTestId(/^product-link-/);

    expect(productLinks).toHaveLength(mockProducts.length);
    expect(await screen.findByText(/All Products List/i)).toBeInTheDocument();
    mockProducts.forEach((product) => {
      const productLink = screen.getByTestId(`product-link-${product._id}`);
      expect(productLink).toBeInTheDocument();
      expect(within(productLink).getByText(product.name)).toBeInTheDocument();
      expect(
        within(productLink).getByText(product.description)
      ).toBeInTheDocument();
      const productPhoto = within(productLink).getByRole("img", {
        name: product.name,
      });
      expect(productPhoto).toBeInTheDocument();
      expect(productPhoto).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
      );
    });
  });

  test("clicking on a product navigates user to product's product update page", async () => {
    axios.get.mockResolvedValue({
      data: { products: mockProducts },
    });

    render(
      <MemoryRouter history>
        <Products />
      </MemoryRouter>
    );
    const productLink = await screen.findByTestId(
      `product-link-${mockProducts[0]._id}`
    );
    expect(productLink).toHaveAttribute(
      "href",
      `/dashboard/admin/product/${mockProducts[0].slug}`
    );
  });
  test("logs error message when fetching products fails", async () => {
    const error = new Error("Unable to fetch products");
    axios.get.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something Went Wrong")
    );
    expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product`);
    expect(console.log).toHaveBeenCalledWith(error);
  });
});
