export interface GlobalAtomicHubResponse { data : Array<AtomicHubSaleResponse>}

export interface AtomicHubAssetResponse {
        template : {
            immutable_data : {
                foil : string,
                name : string,
                edition : string
            }
        },
        mutable_data : {
            BCX : number,
            level : number
        },
        immutable_data : {
            splinterlands_id : string
        }
}

export interface AtomicHubSaleResponse {
    sale_id : string,
    price : {
        amount : string,
        token_precision : number,
        token_symbol : string
    },
    assets : Array<AtomicHubAssetResponse>
}