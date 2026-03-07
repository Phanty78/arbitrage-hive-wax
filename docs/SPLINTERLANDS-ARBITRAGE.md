# Comparateur de prix Splinterlands : AtomicHub vs Marketplace

## Objectif

Identifier les cartes Splinterlands de type **Monster** qui sont **moins chères sur AtomicHub** (blockchain WAX) que sur le marketplace officiel Splinterlands, afin de repérer des opportunités d'arbitrage.

Un seuil configurable (par défaut **10%**) filtre les résultats pour ne montrer que les écarts significatifs, couvrant ainsi les frais de marché des deux plateformes.

---

## APIs utilisées

### 1. Taux de change WAX/USD

**Endpoint :** `GET https://blockchain.api.atomichub.io/v1/exchange`

Renvoie le taux de conversion WAX → USD nécessaire pour comparer les prix entre les deux marchés.

```json
{
  "chain": "wax-mainnet",
  "exchange_rates": [{
    "current_rate": {
      "base_symbol": "WAX",
      "quote_symbol": "USD",
      "median": 62,
      "median_precision": 4
    }
  }]
}
```

**Calcul du taux :** `median / 10^median_precision` → ex: `62 / 10000 = 0.0062 USD/WAX`

---

### 2. Référentiel des cartes Splinterlands

**Endpoint :** `GET https://api.splinterlands.com/cards/get_details`

Renvoie la liste complète des cartes avec leur `id`, `name` et `type`. Sert à faire le lien entre le nom d'une carte (affiché sur AtomicHub) et son `id` numérique (utilisé sur le marketplace Splinterlands).

```json
{
  "id": 2,
  "name": "Giant Roc",
  "color": "Red",
  "type": "Monster",
  "rarity": 1
}
```

**Filtre :** On ne garde que les cartes avec `type === "Monster"`.

**Mapping construit :** `Map<name, id>` → ex: `"Giant Roc" → 2`

---

### 3. Prix sur le marketplace Splinterlands

**Endpoint :** `GET https://api.splinterlands.com/market/for_sale_grouped`

Renvoie les prix groupés par carte, édition et foil. Les prix sont en **USD**.

```json
{
  "card_detail_id": 1,
  "gold": false,
  "foil": 0,
  "edition": 0,
  "qty": 4,
  "level": 1,
  "low_price_bcx": 0.49,
  "low_price": 0.699,
  "high_price": 9.8
}
```

**Champs importants :**
| Champ | Description |
|---|---|
| `card_detail_id` | ID de la carte (lié au référentiel) |
| `gold` | `false` = Standard, `true` = Gold Foil |
| `foil` | `0` = Standard, `1` = Gold Foil |
| `low_price` | Prix le plus bas en USD pour cette combinaison |
| `low_price_bcx` | Prix le plus bas par BCX en USD |

**Indexation :** `Map<"cardId-gold", low_price>` → on garde le prix le plus bas par combo `(card_detail_id, gold)`.

---

### 4. Listings sur AtomicHub (WAX)

**Endpoint :** `GET https://wax-mainnet-aa.api.atomichub.io/atomicmarket/v2/sales`

Renvoie les ventes actives sur le marché WAX. Les prix sont en **WAX** (unités atomiques, 8 décimales).

**Paramètres :**

| Paramètre | Valeur | Description |
|---|---|---|
| `collection_name` | `splintrlands` | Collection Splinterlands |
| `data.type` | `Monster` | Filtre sur le type Monster |
| `state` | `1` | Ventes actives uniquement |
| `symbol` | `WAX` | Prix en WAX |
| `sort` | `price` | Tri par prix |
| `order` | `asc` | Prix croissant |
| `limit` | `100` | Résultats par page |
| `page` | `1, 2, ...` | Pagination |

**Exemple de réponse (simplifié) :**
```json
{
  "data": [{
    "sale_id": "123456",
    "listing_price": "1000000000000",
    "listing_symbol": "WAX",
    "assets": [{
      "data": {
        "name": "Arkemis the Bear",
        "type": "Monster",
        "foil": "Standard",
        "rarity": "Common",
        "edition": "Chaos Legion"
      }
    }],
    "price": {
      "token_symbol": "WAX",
      "token_precision": 8,
      "amount": "1000000000000"
    }
  }]
}
```

**Calcul du prix WAX :** `listing_price / 10^8` → ex: `1000000000000 / 10^8 = 10000 WAX`

**Mapping foil :**
- `"Standard"` → `gold = false` (foil 0)
- `"Gold Foil"` → `gold = true` (foil 1)

---

## Logique de comparaison

### Étape 1 — Collecte des données

Trois appels API en parallèle :
1. Taux WAX/USD
2. Référentiel cartes (`get_details`)
3. Prix Splinterlands (`for_sale_grouped`)

Puis récupération paginée des listings AtomicHub.

### Étape 2 — Matching des cartes

Pour chaque listing AtomicHub :

1. Extraire le **nom** depuis `assets[0].data.name`
2. Extraire le **foil** depuis `assets[0].data.foil` → convertir en `gold` (true/false)
3. Chercher l'**ID** de la carte via le référentiel : `name → card_detail_id`
4. Chercher le **prix Splinterlands** via : `(card_detail_id, gold) → low_price` (USD)

### Étape 3 — Calcul de l'écart

```
prix_atomichub_usd = prix_wax × taux_wax_usd
diff_percent = (prix_splinterlands - prix_atomichub_usd) / prix_splinterlands × 100
```

Si `diff_percent >= THRESHOLD` (défaut 10%) → la carte est **moins chère sur AtomicHub**.

### Étape 4 — Affichage

Tableau en console, trié par % de différence (décroissant) :

```
┌──────────────────────┬──────────┬────────────┬────────────┬──────────────────┬────────┐
│ Carte                │ Foil     │ AtomicHub  │ AtomicHub  │ Splinterlands    │ Diff % │
│                      │          │ (WAX)      │ (USD)      │ (USD)            │        │
├──────────────────────┼──────────┼────────────┼────────────┼──────────────────┼────────┤
│ Arkemis the Bear     │ Standard │ 150 WAX    │ $0.93      │ $1.20            │ 22.5%  │
│ Giant Roc            │ Gold     │ 500 WAX    │ $3.10      │ $3.80            │ 18.4%  │
└──────────────────────┴──────────┴────────────┴────────────┴──────────────────┴────────┘
```

---

## Constante configurable

```js
const THRESHOLD_PERCENT = 10; // % minimum d'écart pour afficher une carte
```

Ce seuil permet de ne pas afficher les écarts trop faibles qui seraient absorbés par les frais de transaction des deux marchés.

---

## Résumé du flux

```
  AtomicHub API                Splinterlands APIs
  (prix en WAX)                (prix en USD)
       │                            │
       ▼                            ▼
  Listings Monster           Référentiel cartes
  name + foil + prix WAX     name → id
       │                            │
       │                     Prix marketplace
       │                     (id, gold) → low_price USD
       │                            │
       ▼                            ▼
       └──────────┬─────────────────┘
                  │
           Taux WAX/USD
           (AtomicHub Exchange API)
                  │
                  ▼
         Comparaison prix USD
         filtre par THRESHOLD
                  │
                  ▼
         Affichage résultats
         (cartes moins chères
          sur AtomicHub)
```
