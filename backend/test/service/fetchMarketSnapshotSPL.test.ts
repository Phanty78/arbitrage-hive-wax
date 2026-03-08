import { describe, it, expect, mock, beforeEach } from "bun:test"
import { getSPLMarketSnapshot } from "../../src/service/fetchMarketSnapshotSPL"

const mockFetch = mock()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe("getSPLMarketSnapshot", () => {
  it("should return a Map with lowest price per card key", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { card_detail_id: 331, foil: 0, edition: 7, low_price_bcx: 1.5, low_price: 1.5, level: 1 },
          { card_detail_id: 331, foil: 0, edition: 7, low_price_bcx: 1.2, low_price: 1.2, level: 1 },
          { card_detail_id: 100, foil: 1, edition: 4, low_price_bcx: 5.0, low_price: 5.0, level: 2 },
        ]),
    })

    const map = await getSPLMarketSnapshot()

    expect(map.get("331_0_7")).toBe(1.2)
    expect(map.get("100_1_4")).toBe(5.0)
  })

  it("should keep existing price if it is lower", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { card_detail_id: 10, foil: 0, edition: 1, low_price_bcx: 2.0, low_price: 2.0, level: 1 },
          { card_detail_id: 10, foil: 0, edition: 1, low_price_bcx: 3.0, low_price: 3.0, level: 1 },
        ]),
    })

    const map = await getSPLMarketSnapshot()

    expect(map.get("10_0_1")).toBe(2.0)
  })

  it("should handle empty listing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const map = await getSPLMarketSnapshot()

    expect(map.size).toBe(0)
  })
})
