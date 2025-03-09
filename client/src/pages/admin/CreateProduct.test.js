import React from "react";
import { render, screen, act, within, waitFor } from "@testing-library/react";
import axios from "axios";
import "@testing-library/jest-dom/extend-expect";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";
import userEvent from "@testing-library/user-event";

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
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
  }) => (
    <select
      data-testid={dataTestId}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
  MockSelect.Option = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  return { Select: MockSelect };
});

describe("Create Product Component", () => {
  let mockCategories, inputValues, populateInputFields, waitForEffect;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCategories = [
      { _id: "categoryId_1", name: "Book" },
      { _id: "categoryId_2", name: "Food" },
      { _id: "categoryId_3", name: "Electronics" },
    ];
    inputValues = {
      name: "Cool product",
      description: "This product is quite cool",
      price: "0",
      quantity: "0",
      category: mockCategories[0]._id,
      shipping: "0",
      photo: new File(["mock content"], "mockFile.jpg", {
        type: "image/jpg",
      }),
    };
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });

    waitForEffect = async () =>
      await waitFor(() =>
        expect(
          within(screen.getByTestId("select-category")).getByText(
            mockCategories[0].name
          )
        ).toBeInTheDocument()
      );

    populateInputFields = async () => {
      await waitForEffect();
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

        const categorySelect = screen.getByTestId("select-category");
        userEvent.selectOptions(categorySelect, inputValues.category);

        const shippingSelect = screen.getByTestId("select-shipping");
        userEvent.selectOptions(shippingSelect, inputValues.shipping);

        const photoInput = screen.getByLabelText(/upload photo/i);
        userEvent.upload(photoInput, inputValues.photo);
      });
    };
  });

  test("renders create product form", async () => {
    render(<CreateProduct />);

    expect(
      await screen.findByPlaceholderText(/write a name/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByPlaceholderText(/write a description/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByPlaceholderText(/write a price/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByPlaceholderText(/write a quantity/i)
    ).toBeInTheDocument();
    expect(await screen.findByTestId("select-shipping")).toBeInTheDocument();
    expect(await screen.findByTestId("select-category")).toBeInTheDocument();
    expect(await screen.findByText(/upload photo/i)).toBeInTheDocument();
    expect(await screen.findByTestId("photo-input")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /create product/i })
    ).toBeInTheDocument();
  });

  test("inputs should be initially empty", async () => {
    render(<CreateProduct />);

    expect((await screen.findByPlaceholderText(/write a name/i)).value).toBe(
      ""
    );
    expect(
      (await screen.findByPlaceholderText(/write a description/i)).value
    ).toBe("");
    expect((await screen.findByPlaceholderText(/write a price/i)).value).toBe(
      ""
    );
    expect(
      (await screen.findByPlaceholderText(/write a quantity/i)).value
    ).toBe("");
    expect((await screen.findByTestId("select-shipping")).value).toBe("");
    expect((await screen.findByTestId("select-category")).value).toBe("");
    expect((await screen.findByTestId("photo-input")).value).toBe("");
  });

  test("should display categories in select menu", async () => {
    render(<CreateProduct />);
    await waitForEffect();
    const selectElem = screen.getByTestId("select-category");

    mockCategories.forEach((category) => {
      expect(within(selectElem).getByText(category.name)).toBeInTheDocument();
    });
  });

  test("should display shipping options in select menu", async () => {
    render(<CreateProduct />);
    const selectElem = await screen.findByTestId("select-shipping");

    expect(within(selectElem).getByText("Yes")).toBeInTheDocument();
    expect(within(selectElem).getByText("No")).toBeInTheDocument();
  });

  test("should allow changing form fields", async () => {
    global.URL.createObjectURL = jest.fn();

    render(<CreateProduct />);
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
      inputValues.shipping
    );
    expect(screen.getByTestId("photo-input").files[0]).toBe(inputValues.photo);
    expect(screen.getByText(inputValues.photo.name)).toBeInTheDocument();
  });

  test("should submit form successfully", async () => {
    global.URL.createObjectURL = jest.fn();
    axios.post.mockResolvedValue({ data: { success: true } });
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    const formData = new FormData();
    for (const [field, value] of Object.entries(inputValues)) {
      formData.append(field, value);
    }

    render(<CreateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );
    const actualFormData = axios.post.mock.calls[0][1];

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Product Created Successfully")
    );
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/create-product",
      expect.any(FormData)
    );
    formData.forEach((value, field) => {
      expect(actualFormData.get(field)).toEqual(value);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
  });

  test("returns correct error message when fields are empty", async () => {
    render(<CreateProduct />);
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("You have some missing fields")
    );
  });

  test("returns correct error message when price is negative", async () => {
    inputValues.price = "-1";

    render(<CreateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Price cannot be negative")
    );
  });

  test("returns correct error message when quantity is negative", async () => {
    inputValues.quantity = "-1";

    render(<CreateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Quantity cannot be negative")
    );
  });

  test("returns error if form submission fails due to api error", async () => {
    const errorMessage = "Unable to create product";
    axios.post.mockResolvedValue({
      data: { success: false, message: errorMessage },
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<CreateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
    expect(axios.post).toHaveBeenCalled();
  });

  test("returns error if form submission fails due to an unexpected error", async () => {
    const error = new Error("Unable to create product");
    axios.post.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<CreateProduct />);
    await populateInputFields();
    userEvent.click(
      screen.getByRole("button", {
        name: /create product/i,
      })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("something went wrong")
    );
    expect(axios.post).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(error);
  });

  test("returns error if unable to fetch categories due to api error", async () => {
    const errorMessage = "Unable to fetch categories";
    axios.get.mockResolvedValueOnce({
      data: { success: false, message: errorMessage },
    });
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<CreateProduct />);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorMessage));
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  test("returns error if unable to fetch categories due to an unexpected error", async () => {
    const error = new Error("Unable to fetch categories");
    axios.get.mockRejectedValueOnce(error);
    jest.spyOn(console, "log").mockImplementationOnce(jest.fn());

    render(<CreateProduct />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting catgeory"
      )
    );
    expect(console.log).toHaveBeenCalledWith(error);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
});
