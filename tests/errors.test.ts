import { describe, expect, it } from "vitest";
import { ThreadsApiError } from "../src/errors";

describe("ThreadsApiError", () => {
  it("contains status, code, subcode, and message", () => {
    const error = new ThreadsApiError({
      status: 400,
      code: 100,
      subcode: 33,
      message: "Invalid parameter",
      body: {
        error: { message: "Invalid parameter", code: 100, error_subcode: 33 },
      },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ThreadsApiError");
    expect(error.status).toBe(400);
    expect(error.code).toBe(100);
    expect(error.subcode).toBe(33);
    expect(error.message).toBe("Invalid parameter");
    expect(error.body).toEqual({
      error: { message: "Invalid parameter", code: 100, error_subcode: 33 },
    });
  });

  it("works without optional fields", () => {
    const error = new ThreadsApiError({
      status: 500,
      message: "Server error",
    });

    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.subcode).toBeUndefined();
    expect(error.body).toBeUndefined();
  });
});
