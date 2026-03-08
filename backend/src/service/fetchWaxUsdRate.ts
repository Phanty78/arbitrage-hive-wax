import { fetchJson } from "../utils/fetchJson";
import { URL_COINGECKO_WAX_USD } from "../config/constants";
import { CoinGeckoWaxResponse } from "../types/coingecko";

export async function getWaxUsdRate(){
    const data = await fetchJson<CoinGeckoWaxResponse>(URL_COINGECKO_WAX_USD)
    return data.wax.usd
}