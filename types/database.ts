// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types générés automatiquement par Supabase CLI
// Commande : npx supabase gen types typescript --project-id YOUR_REF > types/database.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit_fcfa: number | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms_days: number
          phone: string | null
          sector: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit_fcfa?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms_days?: number
          phone?: string | null
          sector?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit_fcfa?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms_days?: number
          phone?: string | null
          sector?: string | null
          updated_at?: string
        }
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          currency: string
          data_retention_days: number
          email: string | null
          id: string
          invoice_counter: number
          invoice_footer: string | null
          invoice_prefix: string
          is_active: boolean
          logo_url: string | null
          name: string
          nif: string | null
          phone: string | null
          plan: string
          plan_expires_at: string | null
          rccm: string | null
          rgpd_accepted_at: string | null
          rgpd_accepted_version: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          data_retention_days?: number
          email?: string | null
          id?: string
          invoice_counter?: number
          invoice_footer?: string | null
          invoice_prefix?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          nif?: string | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          rccm?: string | null
          rgpd_accepted_at?: string | null
          rgpd_accepted_version?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          data_retention_days?: number
          email?: string | null
          id?: string
          invoice_counter?: number
          invoice_footer?: string | null
          invoice_prefix?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          nif?: string | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          rccm?: string | null
          rgpd_accepted_at?: string | null
          rgpd_accepted_version?: string | null
          slug?: string | null
          updated_at?: string
        }
      }
      consent_records: {
        Row: {
          accepted: boolean
          created_at: string
          id: string
          ip_address: string | null
          type: string
          user_agent: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          accepted: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          type: string
          user_agent?: string | null
          user_id?: string | null
          version: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          type?: string
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
      }
      data_requests: {
        Row: {
          company_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          processed_by: string | null
          status: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          status?: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          status?: string
          type?: string | null
          user_id?: string | null
        }
      }
      delivery_notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          issued_date: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          payment_ref: string | null
          payment_terms: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          reference: string
          reminder_sent_at: string | null
          sent_at: string | null
          status: string
          subtotal_fcfa: number
          tax_amount_fcfa: number | null
          tax_rate: number
          total_fcfa: number
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          issued_date: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          payment_terms?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          reference: string
          reminder_sent_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal_fcfa?: number
          tax_rate?: number
          total_fcfa?: number
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          issued_date?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          payment_terms?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          reference?: string
          reminder_sent_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal_fcfa?: number
          tax_rate?: number
          total_fcfa?: number
          trip_id?: string | null
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          full_name: string
          id: string
          license_categories: string[] | null
          license_expiry: string | null
          license_number: string | null
          monthly_salary: number
          national_id: string | null
          phone: string
          status: string
          truck_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          id?: string
          license_categories?: string[] | null
          license_expiry?: string | null
          license_number?: string | null
          monthly_salary?: number
          national_id?: string | null
          phone: string
          status?: string
          truck_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          id?: string
          license_categories?: string[] | null
          license_expiry?: string | null
          license_number?: string | null
          monthly_salary?: number
          national_id?: string | null
          phone?: string
          status?: string
          truck_id?: string | null
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          amount_fcfa: number
          category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_reimbursed: boolean
          receipt_size: number | null
          receipt_url: string | null
          trip_id: string | null
          truck_id: string | null
          updated_at: string
        }
        Insert: {
          amount_fcfa: number
          category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_reimbursed?: boolean
          receipt_size?: number | null
          receipt_url?: string | null
          trip_id?: string | null
          truck_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_fcfa?: number
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_reimbursed?: boolean
          receipt_size?: number | null
          receipt_url?: string | null
          trip_id?: string | null
          truck_id?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
      }
      payments: {
        Row: {
          amount_fcfa: number
          company_id: string
          created_at: string
          created_by: string | null
          date: string
          delivery_note_id: string | null
          id: string
          method: string | null
          notes: string | null
          reference: string | null
        }
        Insert: {
          amount_fcfa: number
          company_id: string
          created_at?: string
          created_by?: string | null
          date: string
          delivery_note_id?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          reference?: string | null
        }
        Update: {
          amount_fcfa?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          delivery_note_id?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          reference?: string | null
        }
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          company_id: string
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_sub_id?: string | null
          updated_at?: string
        }
      }
      trip_lines: {
        Row: {
          description: string
          id: string
          quantity: number
          sort_order: number
          total_fcfa: number | null
          trip_id: string
          unit: string
          unit_price_fcfa: number
        }
        Insert: {
          description: string
          id?: string
          quantity?: number
          sort_order?: number
          trip_id: string
          unit?: string
          unit_price_fcfa?: number
        }
        Update: {
          description?: string
          id?: string
          quantity?: number
          sort_order?: number
          trip_id?: string
          unit?: string
          unit_price_fcfa?: number
        }
      }
      trips: {
        Row: {
          actual_arrival: string | null
          arrival_date: string | null
          cargo_desc: string | null
          cargo_type: string | null
          cargo_weight_kg: number | null
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          departure_date: string | null
          destination: string
          driver_id: string | null
          id: string
          notes: string | null
          origin: string
          reference: string
          revenue_fcfa: number
          status: string
          truck_id: string | null
          updated_at: string
        }
        Insert: {
          actual_arrival?: string | null
          arrival_date?: string | null
          cargo_desc?: string | null
          cargo_type?: string | null
          cargo_weight_kg?: number | null
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          departure_date?: string | null
          destination: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          origin: string
          reference: string
          revenue_fcfa?: number
          status?: string
          truck_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_arrival?: string | null
          arrival_date?: string | null
          cargo_desc?: string | null
          cargo_type?: string | null
          cargo_weight_kg?: number | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          departure_date?: string | null
          destination?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          origin?: string
          reference?: string
          revenue_fcfa?: number
          status?: string
          truck_id?: string | null
          updated_at?: string
        }
      }
      trucks: {
        Row: {
          brand: string | null
          capacity_kg: number
          chassis_number: string | null
          company_id: string
          created_at: string
          fuel_type: string
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          mileage: number
          model: string | null
          notes: string | null
          plate: string
          status: string
          tech_visit_expiry: string | null
          type: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          capacity_kg?: number
          chassis_number?: string | null
          company_id: string
          created_at?: string
          fuel_type?: string
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          mileage?: number
          model?: string | null
          notes?: string | null
          plate: string
          status?: string
          tech_visit_expiry?: string | null
          type?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          capacity_kg?: number
          chassis_number?: string | null
          company_id?: string
          created_at?: string
          fuel_type?: string
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          mileage?: number
          model?: string | null
          notes?: string | null
          plate?: string
          status?: string
          tech_visit_expiry?: string | null
          type?: string | null
          updated_at?: string
          year?: number | null
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          company_id: string
          created_at: string
          data_export_requested_at: string | null
          deletion_requested_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id: string
          created_at?: string
          data_export_requested_at?: string | null
          deletion_requested_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string
          created_at?: string
          data_export_requested_at?: string | null
          deletion_requested_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ── Types helpers ────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
