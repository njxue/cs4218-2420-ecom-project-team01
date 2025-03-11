import { render, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/auth";
import axios from "axios";
import React from "react";

// Mocks
jest.mock("axios");

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Test Component to verify rendered output
const TestComponent = () => {
  const [auth, setAuth] = useAuth();
  ``;
  return (
    <div>
      <div data-testid="auth-token">{auth?.token || "no-token"}</div>
      <div data-testid="user-name">{auth?.user?.name || "no-user"}</div>
      <button
        data-testid="login-button"
        onClick={() =>
          setAuth({ user: { name: "New User" }, token: "new-token" })
        }
      >
        Login
      </button>
      <button
        data-testid="logout-button"
        onClick={() => setAuth({ user: null, token: "" })}
      >
        Logout
      </button>
    </div>
  );
};

describe("Auth Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
  });

  test("provides default empty auth state when localStorage is empty", () => {
    // Arrange
    mockLocalStorage.getItem.mockReturnValue(null);

    // Act
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Assert
    expect(getByTestId("auth-token").textContent).toBe("no-token");
    expect(getByTestId("user-name").textContent).toBe("no-user");
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("auth");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  test("loads auth data from localStorage on mount", () => {
    // Arrange
    const testData = {
      user: { id: 1, name: "Test User" },
      token: "test-token",
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

    // Act
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Assert
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("auth");
    expect(getByTestId("auth-token").textContent).toBe("test-token");
    expect(getByTestId("user-name").textContent).toBe("Test User");
    expect(axios.defaults.headers.common["Authorization"]).toBe("test-token");
  });

  test("handles invalid JSON in localStorage gracefully", () => {
    // Arrange
    mockLocalStorage.getItem.mockReturnValue("invalid-json-data");
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Assert
    expect(getByTestId("auth-token").textContent).toBe("no-token");
    expect(consoleSpy).toHaveBeenCalled();

    // Cleanup
    consoleSpy.mockRestore();
  });

  test("allows updating auth state via setAuth function", () => {
    // Arrange
    mockLocalStorage.getItem.mockReturnValue(null);
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state check
    expect(getByTestId("auth-token").textContent).toBe("no-token");

    // Act
    act(() => {
      getByTestId("login-button").click();
    });

    // Assert
    expect(getByTestId("auth-token").textContent).toBe("new-token");
    expect(getByTestId("user-name").textContent).toBe("New User");
    expect(axios.defaults.headers.common["Authorization"]).toBe("new-token");
  });

  test("allows clearing auth state (logout)", () => {
    // Arrange
    const testData = {
      user: { id: 1, name: "Test User" },
      token: "test-token",
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state check
    expect(getByTestId("auth-token").textContent).toBe("test-token");

    // Act
    act(() => {
      getByTestId("logout-button").click();
    });

    // Assert
    expect(getByTestId("auth-token").textContent).toBe("no-token");
    expect(getByTestId("user-name").textContent).toBe("no-user");
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
  });

  test("useAuth hook provides access to both auth state and setAuth function", () => {
    // Arrange
    mockLocalStorage.getItem.mockReturnValue(null);
    let authState, setAuthFunction;

    const TestHookComponent = () => {
      [authState, setAuthFunction] = useAuth();
      return null;
    };

    // Act
    render(
      <AuthProvider>
        <TestHookComponent />
      </AuthProvider>
    );

    // Assert
    expect(authState).toEqual({ user: null, token: "" });
    expect(typeof setAuthFunction).toBe("function");
  });

  test("useAuth hook throws error when used outside AuthProvider", () => {
    // Arrange
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act & Assert
    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    // Cleanup
    consoleError.mockRestore();
  });
});
