export type Clinic = 'Hemac' | 'MM Balwyn' | 'FNMC' | 'NovaBody'

export type Billing = {
  id: string
  user_name: string
  bill_date: string // ISO date (yyyy-mm-dd)
  clinic: Clinic
  gross_billing: number
  notes?: string | null
  created_at: string
  updated_at: string
}
