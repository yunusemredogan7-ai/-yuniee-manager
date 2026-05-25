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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: number
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: number
          note: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          id?: number
          note?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: number
          note?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          price: number | null
          product_id: number
          quantity: number | null
          size: string | null
        }
        Insert: {
          id?: number
          order_id: number
          price?: number | null
          product_id: number
          quantity?: number | null
          size?: string | null
        }
        Update: {
          id?: number
          order_id?: number
          price?: number | null
          product_id?: number
          quantity?: number | null
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          id: number
          note: string | null
          packaging_cost: number
          source: string | null
          status: string | null
          total_price: number | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: number
          note?: string | null
          packaging_cost?: number
          source?: string | null
          status?: string | null
          total_price?: number | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: number
          note?: string | null
          packaging_cost?: number
          source?: string | null
          status?: string | null
          total_price?: number | null
        }
        Relationships: []
      }
      packaging_materials: {
        Row: {
          active: boolean
          created_at: string
          id: number
          name: string
          unit_cost: number
          unit_type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          name: string
          unit_cost?: number
          unit_type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          name?: string
          unit_cost?: number
          unit_type?: string
        }
        Relationships: []
      }
      product_packaging_rules: {
        Row: {
          active: boolean
          created_at: string
          id: number
          material_id: number | null
          max_qty: number | null
          min_qty: number
          product_id: number | null
          product_type: string | null
          quantity: number
          quantity_mode: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          material_id?: number | null
          max_qty?: number | null
          min_qty?: number
          product_id?: number | null
          product_type?: string | null
          quantity?: number
          quantity_mode?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          material_id?: number | null
          max_qty?: number | null
          min_qty?: number
          product_id?: number | null
          product_type?: string | null
          quantity?: number
          quantity_mode?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_packaging_rules_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "packaging_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packaging_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          color: string | null
          cost: number | null
          created_at: string
          id: number
          name: string
          price: number | null
          product_type: string | null
          size: string | null
          sku: string | null
        }
        Insert: {
          color?: string | null
          cost?: number | null
          created_at?: string
          id?: number
          name: string
          price?: number | null
          product_type?: string | null
          size?: string | null
          sku?: string | null
        }
        Update: {
          color?: string | null
          cost?: number | null
          created_at?: string
          id?: number
          name?: string
          price?: number | null
          product_type?: string | null
          size?: string | null
          sku?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          cost: number | null
          created_at: string
          id: number
          product_id: number
          profit: number | null
          quantity: number
          revenue: number | null
          source: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: number
          product_id: number
          profit?: number | null
          quantity: number
          revenue?: number | null
          source?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: number
          product_id?: number
          profit?: number | null
          quantity?: number
          revenue?: number | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          id: number
          product_id: number
          quantity: number | null
          size: string
          updated_at: string
        }
        Insert: {
          id?: number
          product_id: number
          quantity?: number | null
          size: string
          updated_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          quantity?: number | null
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: number
          product_id: number
          quantity: number
          size: string
          source: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          product_id: number
          quantity: number
          size: string
          source?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          product_id?: number
          quantity?: number
          size?: string
          source?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: number
          label: string | null
          sort_order: number
          status: string | null
          title: string
          updated_at: string | null
          waiting_reason: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: number
          label?: string | null
          sort_order?: number
          status?: string | null
          title: string
          updated_at?: string | null
          waiting_reason?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: number
          label?: string | null
          sort_order?: number
          status?: string | null
          title?: string
          updated_at?: string | null
          waiting_reason?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deliver_order_safely: { Args: { p_order_id: number }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
