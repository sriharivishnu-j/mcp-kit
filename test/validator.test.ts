import { validateMcpJson } from "../src/core/validator";

describe("validator", () => {
  test("validateMcpJson accepts valid config", () => {
    const parsed = validateMcpJson({ servers: { azure: { command: "npx", args: ["-y", "@azure/mcp"] } } });
    expect(parsed.servers.azure.command).toBe("npx");
  });

  test("validateMcpJson rejects missing servers key", () => {
    expect(() => validateMcpJson({})).toThrow();
  });

  test("validateMcpJson rejects non-string command", () => {
    expect(() =>
      validateMcpJson({ servers: { azure: { command: 123, args: ["-y"] } } })
    ).toThrow();
  });
});
