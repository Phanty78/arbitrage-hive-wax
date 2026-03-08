import { describe, it, expect, mock, beforeEach } from "bun:test"
import { getCardDetails } from "../../src/service/fetchCarDetails"

const mockFetch = mock()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe("getCardDetails", () => {
  it("should return a Map of card id to name", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 1, name: "Goblin Mech" },
          { id: 2, name: "Haunted Spirit" },
        ]),
    })

    const map = await getCardDetails()

    expect(map).toBeInstanceOf(Map)
    expect(map.size).toBe(2)
    expect(map.get(1)).toBe("Goblin Mech")
    expect(map.get(2)).toBe("Haunted Spirit")
  })

  it("should handle empty card list", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const map = await getCardDetails()

    expect(map.size).toBe(0)
  })
})
