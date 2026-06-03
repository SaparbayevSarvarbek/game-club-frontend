export interface FetchProduct {
  id: number
  name: string
  price: number
  cost_price?: number
  purchase_total?: number
  quantity?: number
  created_at: string
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
  sale_key?: string
  source?: 'direct' | 'session' | string
  user_id: number
  operator_name?: string | null
  product_id: number
  product_name?: string | null
  quantity: number
  unit_price?: number
  cost_price?: number
  profit?: number
  total_amount: number
  payment_cash: number
  payment_card: number
  payment_debt?: number
  debtor_id?: number | null
  computer_id?: number | null
  computer_number?: number | null
  created_at: string
}
