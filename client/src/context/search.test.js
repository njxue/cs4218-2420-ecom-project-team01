import { render, act, screen, renderHook } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { SearchProvider, useSearch } from "./search";
import { describe } from "node:test";

describe("Search Context", () => {
  test("default search keyword and results should be empty", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    expect(result.current[0]).toEqual({ keyword: "", results: [] });
  });

  test("should update keyword correctly", () => {
    const testKeyword = "test keyword";
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    act(() => {
      result.current[1]({ keyword: testKeyword, results: [] });
    });

    expect(result.current[0].keyword).toBe(testKeyword);
  });

  test("should update results correctly", () => {
    const testResults = ["product 1", "product 2"];
    const { result } = renderHook(() => useSearch(), {
      wrapper: ({ children }) => <SearchProvider>{children}</SearchProvider>,
    });

    act(() => {
      result.current[1]({ keyword: "", results: testResults });
    });

    expect(result.current[0].results).toEqual(testResults);
  });
});
