import { describe, it, expect, mock, beforeEach } from "bun:test"
import { getWaxUsdRate } from "../../src/service/fetchWaxUsdRate"

const mockFetch = mock()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe("getWaxUsdRate", () => {
  it("should return the WAX/USD rate", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ wax: { usd: 0.0423 } }),
    })

    const rate = await getWaxUsdRate()

    expect(rate).toBe(0.0423)
  })
})
