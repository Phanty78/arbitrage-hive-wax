import { describe, it, expect, mock, beforeEach } from "bun:test"
import { getAHMarketSnapshot } from "../../src/service/fetchMarketSnapshotAH"

const mockFetch = mock()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

const makeSale = (saleId: string) => ({
  sale_id: saleId,
  price: { amount: "100000000", token_precision: 8, token_symbol: "WAX" },
  assets: [],
})

describe("getAHMarketSnapshot", () => {
  it("should accumulate sales across multiple pages", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [makeSale("1"), makeSale("2")] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [makeSale("3")] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })

    const result = await getAHMarketSnapshot()

    expect(result).toHaveLength(3)
    expect(result[0].sale_id).toBe("1")
    expect(result[2].sale_id).toBe("3")
  })

  it("should return empty array if first page is empty", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const result = await getAHMarketSnapshot()

    expect(result).toHaveLength(0)
  })
})
