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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bills: {
        Row: {
          balance_amount: number | null
          bank_name: string | null
          bill_date: string | null
          bill_number: string | null
          business_id: string
          cleaning_charge: number | null
          cash_amount: number | null
          delivery_charge: number | null
          check_number: string | null
          created_at: string | null
          advance_amount: number | null
          customer_name: string
          customer_phone: string | null
          gpay_amount: number | null
          id: number
          items: Json
          paid_amount: number | null
          payment_method: string
          timestamp: string | null
          total_amount: number
          upi_type: string | null
        }
        Insert: {
          balance_amount?: number | null
          bank_name?: string | null
          bill_date?: string | null
          bill_number?: string | null
          business_id: string
          cleaning_charge?: number | null
          cash_amount?: number | null
          delivery_charge?: number | null
          check_number?: string | null
          created_at?: string | null
          advance_amount?: number | null
          customer_name: string
          customer_phone?: string | null
          gpay_amount?: number | null
          id?: number
          items: Json
          paid_amount?: number | null
          payment_method: string
          timestamp?: string | null
          total_amount: number
          upi_type?: string | null
        }
        Update: {
          balance_amount?: number | null
          bank_name?: string | null
          bill_date?: string | null
          bill_number?: string | null
          business_id?: string
          cleaning_charge?: number | null
          cash_amount?: number | null
          delivery_charge?: number | null
          check_number?: string | null
          created_at?: string | null
          advance_amount?: number | null
          customer_name?: string
          customer_phone?: string | null
          gpay_amount?: number | null
          id?: number
          items?: Json
          paid_amount?: number | null
          payment_method?: string
          timestamp?: string | null
          total_amount?: number
          upi_type?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          balance: number | null
          business_id: string
          created_at: string | null
          gst_number: string | null
          id: number
          name: string
          phone: string
        }
        Insert: {
          balance?: number | null
          business_id: string
          created_at?: string | null
          gst_number?: string | null
          id?: number
          name: string
          phone: string
        }
        Update: {
          balance?: number | null
          business_id?: string
          created_at?: string | null
          gst_number?: string | null
          id?: number
          name?: string
          phone?: string
        }
        Relationships: []
      }
      shops_logins: {
        Row: {
          id: number
          username: string
          password: string
          business_id: string
          logo_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          username: string
          password: string
          business_id: string
          logo_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          username?: string
          password?: string
          business_id?: string
          logo_url?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          business_id: string
          chicken_stock_kg: number | null
          id: number
          last_updated: string | null
          remaining_quantity: number
          updated_at: string | null
        }
        Insert: {
          business_id: string
          chicken_stock_kg?: number | null
          id?: number
          last_updated?: string | null
          remaining_quantity?: number
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          chicken_stock_kg?: number | null
          id?: number
          last_updated?: string | null
          remaining_quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      load_entries: {
        Row: {
          business_id: string
          created_at: string | null
          entry_date: string
          id: number
          no_of_boxes: number
          no_of_boxes_after: number
          quantity_after_box: number
          quantity_with_box: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          entry_date: string
          id?: number
          no_of_boxes: number
          no_of_boxes_after: number
          quantity_after_box: number
          quantity_with_box: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          entry_date?: string
          id?: number
          no_of_boxes?: number
          no_of_boxes_after?: number
          quantity_after_box?: number
          quantity_with_box?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          date: string
          id: number
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string | null
          date: string
          id?: number
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          date?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
