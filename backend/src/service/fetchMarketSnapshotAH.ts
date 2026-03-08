import { fetchJson } from "../utils/fetchJson";
import { URL_MARKET_SNAPSHOT_AH } from "../config/constants";
import { GlobalAtomicHubResponse, AtomicHubSaleResponse } from "../types/atomichub";

export async function getAHMarketSnapshot(){
    let activePage: number = 1
    let result: Array<AtomicHubSaleResponse> = []
    while (true){
        const data = await fetchJson<GlobalAtomicHubResponse>(`${URL_MARKET_SNAPSHOT_AH}&page=${activePage}`)
        // On ajoute au tableau de résultats la page qu'on vient de fetch.
        result.push(...data.data)
        activePage++
        if (data.data.length === 0 || activePage >= 200) {
            break
        }
    }
    return result
}