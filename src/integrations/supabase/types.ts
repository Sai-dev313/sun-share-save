export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bill_payments: {
        Row: {
          bill_amount: number
          billing_month: string
          cash_paid: number
          consumer_name: string
          consumer_number: string
          created_at: string
          credit_savings: number
          credits_used: number
          id: string
          meter_number: string
          provider: string
          rate_per_unit: number
          units_consumed: number
          user_id: string
        }
        Insert: {
          bill_amount: number
          billing_month?: string
          cash_paid?: number
          consumer_name?: string
          consumer_number?: string
          created_at?: string
          credit_savings?: number
          credits_used?: number
          id?: string
          meter_number?: string
          provider?: string
          rate_per_unit?: number
          units_consumed?: number
          user_id: string
        }
        Update: {
          bill_amount?: number
          billing_month?: string
          cash_paid?: number
          consumer_name?: string
          consumer_number?: string
          created_at?: string
          credit_savings?: number
          credits_used?: number
          id?: string
          meter_number?: string
          provider?: string
          rate_per_unit?: number
          units_consumed?: number
          user_id?: string
        }
        Relationships: []
      }
      energy_logs: {
        Row: {
          created_at: string | null
          generated: number | null
          id: string
          log_date: string | null
          sent_to_grid: number | null
          used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated?: number | null
          id?: string
          log_date?: string | null
          sent_to_grid?: number | null
          used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated?: number | null
          id?: string
          log_date?: string | null
          sent_to_grid?: number | null
          used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          created_at: string | null
          credits_available: number
          id: string
          price_per_credit: number
          seller_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          credits_available: number
          id?: string
          price_per_credit: number
          seller_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          credits_available?: number
          id?: string
          price_per_credit?: number
          seller_id?: string
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cash: number | null
          created_at: string | null
          credits: number | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          cash?: number | null
          created_at?: string | null
          credits?: number | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          cash?: number | null
          created_at?: string | null
          credits?: number | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          buyer_id: string
          created_at: string | null
          credits_amount: number
          id: string
          listing_id: string | null
          seller_id: string
          total_price: number
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          credits_amount: number
          id?: string
          listing_id?: string | null
          seller_id: string
          total_price: number
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          credits_amount?: number
          id?: string
          listing_id?: string | null
          seller_id?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_listing:
        | {
            Args: { p_credits: number; p_price_per_credit: number }
            Returns: {
              listing_id: string
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_credits: number
              p_price_per_credit: number
              p_seller_id: string
            }
            Returns: {
              listing_id: string
              message: string
              success: boolean
            }[]
          }
      earn_credits:
        | {
            Args: never
            Returns: {
              credits_earned: number
              message: string
              success: boolean
            }[]
          }
        | {
            Args: { p_user_id: string }
            Returns: {
              credits_earned: number
              message: string
              success: boolean
            }[]
          }
      is_own_listing: { Args: { p_listing_id: string }; Returns: boolean }
      log_energy: {
        Args: { p_generated: number; p_used: number }
        Returns: {
          message: string
          sent_to_grid: number
          success: boolean
        }[]
      }
      pay_bill:
        | {
            Args: { p_bill_amount: number; p_credits_to_use: number }
            Returns: {
              cash_remaining: number
              credits_remaining: number
              message: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_bill_amount: number
              p_billing_month?: string
              p_consumer_name?: string
              p_consumer_number?: string
              p_credits_to_use: number
              p_meter_number?: string
              p_provider?: string
              p_units_consumed?: number
            }
            Returns: {
              cash_remaining: number
              credits_remaining: number
              message: string
              receipt_id: string
              success: boolean
            }[]
          }
      purchase_listing:
        | {
            Args: { p_buyer_id: string; p_listing_id: string }
            Returns: {
              message: string
              success: boolean
            }[]
          }
        | {
            Args: { p_listing_id: string }
            Returns: {
              message: string
              success: boolean
            }[]
          }
      redeem_credits:
        | {
            Args: { p_credits: number }
            Returns: {
              message: string
              savings: number
              success: boolean
            }[]
          }
        | {
            Args: { p_credits: number; p_user_id: string }
            Returns: {
              message: string
              savings: number
              success: boolean
            }[]
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
