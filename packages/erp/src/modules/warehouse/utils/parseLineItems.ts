// ============================================================
// Parse textarea lines → GRN/GIN line items (productId,qty,cost)
// ============================================================

export interface ParsedGrnLine {
  productId: string
  qtyExpected: number
  unitCost?: number
}

export interface ParsedGinLine {
  productId: string
  qtyRequested: number
  unitCost?: number
}

function parseRawLines(raw: string) {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [productId, qtyStr, costStr] = line.split(/[,;\t]/).map((x) => x.trim())
      return { productId, qtyStr, costStr }
    })
    .filter((x) => x.productId)
}

export function parseGrnLines(raw: string): ParsedGrnLine[] {
  return parseRawLines(raw).map(({ productId, qtyStr, costStr }) => ({
    productId,
    qtyExpected: Number(qtyStr || 1),
    unitCost: costStr ? Number(costStr) : undefined,
  }))
}

export function parseGinLines(raw: string): ParsedGinLine[] {
  return parseRawLines(raw).map(({ productId, qtyStr, costStr }) => ({
    productId,
    qtyRequested: Number(qtyStr || 1),
    unitCost: costStr ? Number(costStr) : undefined,
  }))
}
