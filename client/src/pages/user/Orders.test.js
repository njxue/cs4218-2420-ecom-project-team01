import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import Orders from "./Orders";
import moment from "moment";
const { useAuth } = require("../../context/auth");

// Mock dependencies
jest.mock("axios");
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">User Menu</div>
));
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));
jest.mock("moment", () => {
  const mockMoment = jest.fn(() => ({
    fromNow: () => "2 days ago",
  }));
  return mockMoment;
});

// Mock data for testing
const mockOrders = [
  {
    _id: "order1",
    status: "Processing",
    buyer: { name: "John Doe" },
    createAt: "2023-04-01T12:00:00Z",
    payment: { success: true },
    products: [
      {
        _id: "product1",
        name: "Product 1",
        description:
          "This is a description that is longer than 30 characters to test substring",
        price: 99.99,
      },
      {
        _id: "product2",
        name: "Product 2",
        description: "Short description",
        price: 49.99,
      },
    ],
  },
  {
    _id: "order2",
    status: "Shipped",
    buyer: { name: "Jane Smith" },
    createAt: "2023-04-05T12:00:00Z",
    payment: { success: false },
    products: [
      {
        _id: "product3",
        name: "Product 3",
        description: "Another product description",
        price: 29.99,
      },
    ],
  },
];

describe("Orders Component", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Orders component correctly with title", () => {
    useAuth.mockReturnValue([null, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] });

    render(<Orders />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
    expect(screen.getByTestId("layout-title").textContent).toBe("Your Orders");
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  test("doesn't fetch orders when user is not authenticated", async () => {
    useAuth.mockReturnValue([{ token: null }, jest.fn()]);

    render(<Orders />);

    expect(axios.get).not.toHaveBeenCalled();
  });

  test("fetches orders when user is authenticated", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] });

    await act(async () => {
      render(<Orders />);
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
  });

  test("displays orders when data is loaded", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });

    await act(async () => {
      render(<Orders />);
    });

    await waitFor(() => {
      // Check for order status
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("Shipped")).toBeInTheDocument();

      // Check for buyers
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();

      // Check for payment status
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();

      // Check for products
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
      expect(screen.getByText("Product 3")).toBeInTheDocument();

      // Check for truncated descriptions (first 30 characters)
      expect(
        screen.getByText("This is a description that is")
      ).toBeInTheDocument();
    });
  });

  test("shows no orders when array is empty", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] });

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
  });

  test("handles API error correctly", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = new Error("API Error");
    axios.get.mockRejectedValue(error);

    await act(async () => {
      render(<Orders />);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    consoleErrorSpy.mockRestore();
  });

  test("displays correct image source for products", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });

    await act(async () => {
      render(<Orders />);
    });

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/product1"
    );
    expect(images[1]).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/product2"
    );
    expect(images[2]).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/product3"
    );
  });

  test("renders date using moment correctly", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: mockOrders });

    await act(async () => {
      render(<Orders />);
    });

    // Check that moment was called with the correct dates
    expect(moment).toHaveBeenCalledWith(mockOrders[0].createAt);
    expect(moment).toHaveBeenCalledWith(mockOrders[1].createAt);

    // Check that fromNow dates are displayed (from our mock, always "2 days ago")
    const dates = screen.getAllByText("2 days ago");
    expect(dates.length).toBe(2);
  });

  test("handles null values in order data gracefully", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    const incompleteOrders = [
      {
        _id: "order3",
        status: null,
        buyer: null,
        createAt: null,
        payment: null,
        products: null,
      },
    ];

    axios.get.mockResolvedValue({ data: incompleteOrders });

    await act(async () => {
      render(<Orders />);
    });

    // Component should render without crashing and fallbacks should appear
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  test("handles incomplete order data with fallback values", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    const incompleteOrders = [
      {
        _id: "order4",
        status: "Processing",
        buyer: null,
        createAt: null,
        payment: { success: true },
        products: [
          { _id: "product4", name: "Product 4", description: "Some description", price: 199.99 },
        ],
      },
    ];
    axios.get.mockResolvedValue({ data: incompleteOrders });

    await act(async () => {
      render(<Orders />);
    });

    // Check that fallback values are used for missing buyer and date
    expect(screen.getByText("Unknown Buyer")).toBeInTheDocument();
    expect(screen.getByText("Unknown Date")).toBeInTheDocument();
  });

  test("truncates long product descriptions correctly", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    const longDescription =
      "This is a very long description that definitely exceeds thirty characters.";
    const truncated = longDescription.substring(0, 30);
    const orderWithLongDesc = [
      {
        _id: "order5",
        status: "Processing",
        buyer: { name: "Alice" },
        createAt: "2023-04-10T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "product5",
            name: "Product 5",
            description: longDescription,
            price: 199.99,
          },
        ],
      },
    ];
    axios.get.mockResolvedValue({ data: orderWithLongDesc });

    await act(async () => {
      render(<Orders />);
    });

    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  test("re-fetches orders when auth token changes", async () => {
    const mockSetAuth = jest.fn();
    // First render without token
    useAuth.mockReturnValue([{ token: null }, mockSetAuth]);
    axios.get.mockResolvedValue({ data: [] });

    let rerender;
    await act(async () => {
      const { rerender: r } = render(<Orders />);
      rerender = r;
    });

    expect(axios.get).not.toHaveBeenCalled();

    // Then rerender with token
    useAuth.mockReturnValue([{ token: "new-token" }, mockSetAuth]);

    await act(async () => {
      rerender(<Orders />);
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("displays a message when there are no orders", async () => {
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: [] });
  
    await act(async () => {
      render(<Orders />);
    });
  
    expect(screen.getByText("No orders found.")).toBeInTheDocument(); // Replace with actual empty state message
  });
  
});
