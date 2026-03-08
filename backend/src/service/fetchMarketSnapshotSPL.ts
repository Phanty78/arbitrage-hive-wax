import { fetchJson } from "../utils/fetchJson";
import { MarketListingResponse } from "../types/splinterlands";
import { URL_MARKET_SNAPSHOT_SPL } from "../config/constants";

export async function getSPLMarketSnapshot(){
    const data = await fetchJson<MarketListingResponse[]>(URL_MARKET_SNAPSHOT_SPL)
    const map = new Map<string, number>()
    for (const price of data){
        const key = `${price.card_detail_id}_${price.foil}_${price.edition}`
        if (map.has(key)){
            const actualPrice = map.get(key)
            if (actualPrice !== undefined && actualPrice > price.low_price){
                map.set(key, price.low_price)
            }
        }else{
            map.set(key, price.low_price)
        }
    }
    return map
}
