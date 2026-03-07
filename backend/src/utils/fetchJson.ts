export async function fetchJson<T>(url: string): Promise<T>{

    if (url === ""){
        throw new Error(`${url} can't be empty`)
    }

    const res = await fetch(url)
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`)
    }
    return res.json()
}