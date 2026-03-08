import { fetchJson } from "../utils/fetchJson";
import { URL_CARD_DETAILS_SPL } from "../config/constants";
import { CardDetailsResponse } from "../types/splinterlands";

export async function getCardDetails(){
    const data = await fetchJson<CardDetailsResponse[]>(URL_CARD_DETAILS_SPL)
    const map = new Map<number, string>()
    for (const card of data){
        map.set(card.id,card.name)
    }
    return map
}