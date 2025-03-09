import React from "react";
import { render, screen, within, waitFor, act } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
  useParams: jest.fn().mockReturnValue(jest.fn().mockReturnValue("test-slug")),
  useNavigate: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("./../../components/AdminMenu", () => () => <>Mock Menu</>);

// Need to mock, or else will have error
jest.mock("antd", () => {
  const MockSelect = ({
    placeholder,
    children,
    onChange,
    "data-testid": dataTestId,
    value,
  }) => (
    <select
      data-testid={dataTestId}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      value={value}>
      {children}
    </select>
  );
  MockSelect.Option = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  return { Select: MockSelect };
});
global.URL.createObjectURL = jest.fn().mockReturnValue("photoUrl");

describe("Update Product Component", () => {
  let mockCategories,
    inputValues,
    mockProduct,
    populateInputFields,
    waitForEffect;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategories = [
      { _id: "categoryId_2", name: "Food" },
      { _id: "categoryId_3", name: "Electronics" },
    ];
    mockProduct = {
      _id: "productId",
      name: "Cool product",
      description: "This product is quite cool",
      price: "7.99",
      quantity: "3",
      category: mockCategories[0]._id,
      shipping: true,
      photo: new File(["mock content"], "mockFile.jpg", {
        type: "image/jpg",
      }),
    };
    inputValues = {
      name: "Cool product",
      description: "This product is quite cool",
      price: "8.99",
      quantity: "5",
      category: mockCategories[1]._id,
      shipping: false,
      photo: new File(["another mock content"], "anotherMockFile.jpg", {
        type: "image/jpg",
      }),
    };

    populateInputFields = async () => {
      await waitForEffect(); // Wait for category options
      await act(async () => {
        const nameField = screen.getByPlaceholderText(/write a name/i);
        userEvent.clear(nameField);
        userEvent.type(nameField, inputValues.name);

        const descriptionField =
          screen.getByPlaceholderText(/write a description/i);
        userEvent.clear(descriptionField);
        userEvent.type(descriptionField, inputValues.description);

        const priceField = screen.getByPlaceholderText(/write a price/i);
        userEvent.clear(priceField);
        userEvent.type(priceField, inputValues.price);

        const quantityField = screen.getByPlaceholderText(/write a quantity/i);
        userEvent.clear(quantityField);
        userEvent.type(quantityField, inputValues.quantity);

        userEvent.selectOptions(
          screen.getByTestId("select-category"),
          inputValues.category
        );

        userEvent.selectOptions(
          screen.getByTestId("select-shipping"),
          inputValues.shipping ? "1" : "0"
        );

        const photoInput = screen.getByTestId("photo-input");
        userEvent.upload(photoInput, inputValues.photo);
      });
    };

    axios.get.mockImplementation((url) => {
      const params = useParams();
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        case `/api/v1/product/get-product/${params.slug}`:
          return Promise.resolve({
            data: { success: true, product: mockProduct },
          });
      }
    });
    // Wait for product details and category to be fetched and set as state
    waitForEffect = async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
          mockProduct.name
        );
        expect(
          within(screen.getByTestId("select-category")).getByText(
            mockCategories[0].name
          )
        ).toBeInTheDocument();
      });
    };
  });

  test("renders form with inputs filled with the fetched product's details", async () => {
    render(<UpdateProduct />);
    await waitForEffect();

    expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
      mockProduct.name
    );
    expect(screen.getByPlaceholderText(/write a description/i).value).toBe(
      mockProduct.description
    );
    expect(screen.getByPlaceholderText(/write a price/i).value).toBe(
      mockProduct.price
    );
    expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe(
      mockProduct.quantity
    );
    expect(screen.getByTestId("select-shipping").value).toBe(
      mockProduct.shipping ? "1" : "0"
    );
    expect(screen.getByTestId("select-category").value).toBe(
      mockProduct.category
    );
    expect(screen.getByTestId("photo-input").value).toBe("");
    expect(screen.getByTestId("fetched-product-photo")).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${mockProduct._id}`
    );
    expect(
      screen.getByRole("button", { name: /update product/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete product/i })
    ).toBeInTheDocument();
  });

  test("should display categories in select menu", async () => {
    render(<UpdateProduct />);
    await waitForEffect();
    const selectElem = screen.getByTestId("select-category");

    mockCategories.forEach((category) => {
      expect(within(selectElem).getByText(category.name)).toBeInTheDocument();
    });
  });

  test("should display shipping options in select menu", async () => {
    render(<UpdateProduct />);
    const selectElem = await screen.findByTestId("select-shipping");

    expect(within(selectElem).getByText("Yes")).toBeInTheDocument();
    expect(within(selectElem).getByText("No")).toBeInTheDocument();
  });

  test("should allow changing form fields", async () => {
    render(<UpdateProduct />);
    await populateInputFields();

    expect(screen.getByPlaceholderText(/write a name/i).value).toBe(
      inputValues.name
    );
    expect(screen.getByPlaceholderText(/write a description/i).value).toBe(
      inputValues.description
    );
    expect(screen.getByPlaceholderText(/write a price/i).value).toBe(
      inputValues.price
    );
    expect(screen.getByPlaceholderText(/write a quantity/i).value).toBe(
      inputValues.quantity
    );
    expect(screen.getByTestId("select-category").value).toBe(
      inputValues.category
    );
    expect(screen.getByTestId("select-shipping").value).toBe(
      inputValues.shipping ? "1" : "0"
    );
    expect(screen.getByTestId("photo-input").files[0]).toBe(inputValues.photo);
    expect(screen.getByText(inputValues.photo.name)).toBeInTheDocument();
    expect(screen.getByTestId("uploaded-product-photo")).toBeInTheDocument();
  });

  test("should submit form successfully", async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    const formData = new FormData();
    for (const [field, value] of Object.entries(inputValues)) {
      formData.append(field, value);
    }

    render(<UpdateProduct />);
    await populateInputFields();

    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );
    const actualFormData = axios.put.mock.calls[0][1];

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Product Updated Successfully"
      );
    });
    formData.forEach((value, field) => {
      expect(actualFormData.get(field)).toEqual(value);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    expect(axios.put).toHaveBeenCalledWith(
      `/api/v1/product/update-product/${mockProduct._id}`,
      expect.any(FormData)
    );
  });

  test.each([
    ["name", () => screen.getByPlaceholderText(/write a name/i)],
    ["description", () => screen.getByPlaceholderText(/write a description/i)],
    ["price", () => screen.getByPlaceholderText(/write a price/i)],
    ["quantity", () => screen.getByPlaceholderText(/write a quantity/i)],
  ])("returns error message when %s is missing", async (field, getSelector) => {
    render(<UpdateProduct />);
    userEvent.clear(getSelector());
    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("You have some missing fields")
    );
  });

  test("returns correct error message when price is negative", async () => {
    inputValues.price = "-1";

    render(<UpdateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Price cannot be negative")
    );
  });

  test("returns correct error message when quantity is negative", async () => {
    inputValues.quantity = "-1";

    render(<UpdateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Quantity cannot be negative")
    );
  });

  test("returns error if form submission fails due to api error", async () => {
    const errorMessage = "Unable to update product";
    axios.put.mockResolvedValue({
      data: { success: false, message: errorMessage },
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<UpdateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
    expect(axios.put).toHaveBeenCalled();
  });

  test("returns error if form submission fails due to an unexpected error", async () => {
    const error = new Error("Unable to update product");
    axios.put.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<UpdateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /update product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("something went wrong")
    );
    expect(axios.put).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(error);
  });

  test("returns error if unable to fetch categories due to api error", async () => {
    const errorMessage = "Unable to fetch categories";
    axios.get.mockImplementation((url) => {
      const params = useParams();
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: false, message: errorMessage },
          });
        case `/api/v1/product/get-product/${params.slug}`:
          return Promise.resolve({
            data: { success: true, product: mockProduct },
          });
      }
    });
    render(<UpdateProduct />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
  });

  test("returns error if unable to fetch categories due to an unexpected error", async () => {
    const error = new Error("Unable to fetch categories");
    axios.get.mockImplementation((url) => {
      const params = useParams();
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.reject(error);
        case `/api/v1/product/get-product/${params.slug}`:
          return Promise.resolve({
            data: { success: true, product: mockProduct },
          });
      }
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<UpdateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      )
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });

  test("returns error if unable to fetch product due to api error", async () => {
    const errorMessage = "Unable to fetch product";
    const params = useParams();
    axios.get.mockImplementation((url) => {
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        case `/api/v1/product/get-product/${params.slug}`:
          return Promise.resolve({
            data: { success: false, product: null, message: errorMessage },
          });
      }
    });
    render(<UpdateProduct />);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
  });

  test("returns error if unable to fetch product due to an unexpected error", async () => {
    const error = new Error("Unable to fetch categories");
    axios.get.mockImplementation((url) => {
      const params = useParams();
      switch (url) {
        case "/api/v1/category/get-category":
          return Promise.resolve({
            data: { success: true },
            category: mockCategories,
          });
        case `/api/v1/product/get-product/${params.slug}`:
          return Promise.reject(error);
      }
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<UpdateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting product"
      )
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });

  test("deletes product when user answers prompt", async () => {
    window.prompt = jest.fn().mockReturnValue("answer");
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<UpdateProduct />);
    await waitForEffect();
    userEvent.click(
      screen.getByRole("button", {
        name: /delete product/i,
      })
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully")
    );
    expect(axios.delete).toHaveBeenCalledWith(
      `/api/v1/product/delete-product/${mockProduct._id}`
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  test("should not delete product when user does not answer prompt", async () => {
    window.prompt = jest.fn().mockReturnValue("");

    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<UpdateProduct />);
    await waitForEffect();

    userEvent.click(
      screen.getByRole("button", {
        name: /delete product/i,
      })
    );

    expect(axios.delete).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("returns error if unable to delete product due to api error", async () => {
    const errorMessage = "Unable to delete product";
    window.prompt = jest.fn().mockReturnValue("answer");
    axios.delete.mockResolvedValueOnce({
      data: { success: false, message: errorMessage },
    });

    render(<UpdateProduct />);
    userEvent.click(
      screen.getByRole("button", {
        name: /delete product/i,
      })
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
  });

  test("returns error if unable to delete product due to unexpected error", async () => {
    const error = new Error("Unable to delete product");
    window.prompt = jest.fn().mockReturnValue("answer");
    axios.delete.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<UpdateProduct />);
    userEvent.click(
      screen.getByRole("button", {
        name: /delete product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong")
    );
    expect(console.log).toHaveBeenCalledWith(error);
  });
});
