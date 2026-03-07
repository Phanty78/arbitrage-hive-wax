// CONFIG

// Nombre maximum de résultats par page lors de l'appel à l'api market snapshot Atomic Hub.
const ATOMICHUB_PAGE_SIZE = 100

// Seuil de réduction minimum pour qu'une carte soit retournée par le système en tant que deal intéressant.
export const MIN_DISCOUNT_PCT = 10;

// URL

// URL CoinGecko pour récupérer la valeur en wax par rapport au dollar.
export const URL_COINGECKO_WAX_USD = "https://api.coingecko.com/api/v3/simple/price?ids=wax&vs_currencies=usd"

// URL pour récupérer la correspondance des ID et des NAME de toutes les cartes Sprinterland.
export const URL_CARD_DETAILS_SPL = "https://api2.splinterlands.com/cards/get_details"

// URL pour récupérer un snapshot de l'état du marché Splinterland.
export const URL_MARKET_SNAPSHOT_SPL = "https://api2.splinterlands.com/market/for_sale_grouped"

// URL pour récupérer l'état des listings sur Atomic Hub pour la collection Splinterland.
export const URL_MARKET_SNAPSHOT_AH = `https://wax.api.atomicassets.io/atomicmarket/v2/sales?collection_name=splintrlands&state=1&sort=price&order=asc&limit=${ATOMICHUB_PAGE_SIZE}`
