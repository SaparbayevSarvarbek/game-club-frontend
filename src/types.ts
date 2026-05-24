export interface FetchProduct {
  id: number
  name: string
  price: number
  quantity?: number
  created_at?: string
  updated_by?: number | null
}

export interface FetchComputer {
  id: number
  number: number
  type: string
  is_active: boolean
}

export interface FetchProductSale {
  id: number
  user_id: number
  product_id: number
  quantity: number
  total_amount: number
  payment_cash: number
  payment_card: number
  payment_debt?: number
  debtor_id?: number | null
  created_at?: string
}
