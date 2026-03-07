import { describe, it, expect, mock, beforeEach } from "bun:test"
import { fetchJson } from "../../src/utils/fetchJson"

// HINT: on mock fetch globalement pour ne pas dépendre d'APIs externes dans les tests
const mockFetch = mock()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe("fetchJson", () => {
  it("should return parsed JSON on success", async () => {
    const data = { id: 1, name: "test" }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    })

    const result = await fetchJson<{ id: number; name: string }>("https://example.com/api")

    expect(mockFetch).toHaveBeenCalledWith("https://example.com/api")
    expect(result).toEqual(data)
  })

  it("should throw on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    })

    expect(async () => await fetchJson("https://example.com/missing")).toThrow(
      "HTTP 404 for https://example.com/missing",
    )
  })

  it("should throw on empty URL", async () => {
    expect(async () => await fetchJson("")).toThrow("can't be empty")
  })
})
