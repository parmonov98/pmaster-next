export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          user_id: string
          business_profile_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          user_id?: string
          business_profile_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          user_id?: string
          business_profile_id?: string | null
          created_at?: string
        }
      }
      repairs: {
        Row: {
          id: string
          repair_id: string
          customer_id: string
          user_id: string
          business_profile_id: string | null
          device_type: string
          device_type_id: string | null
          device_model: string | null
          serial_number: string | null
          issue_description: string
          price: number | null
          status: 'accepted' | 'diagnosed' | 'fixed' | 'picked' | 'completed' | 'cancelled'
          cancellation_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repair_id: string
          customer_id: string
          user_id?: string
          business_profile_id?: string | null
          device_type: string
          device_type_id?: string | null
          device_model?: string | null
          serial_number?: string | null
          issue_description: string
          price?: number | null
          status?: 'accepted' | 'diagnosed' | 'fixed' | 'picked' | 'completed' | 'cancelled'
          cancellation_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repair_id?: string
          customer_id?: string
          user_id?: string
          business_profile_id?: string | null
          device_type?: string
          device_type_id?: string | null
          device_model?: string | null
          serial_number?: string | null
          issue_description?: string
          price?: number | null
          status?: 'accepted' | 'diagnosed' | 'fixed' | 'picked' | 'completed' | 'cancelled'
          cancellation_note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      diagnostics: {
        Row: {
          id: string
          repair_id: string
          user_id: string
          business_profile_id: string | null
          estimated_time: number | null
          estimated_cost: number | null
          required_parts: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repair_id: string
          user_id?: string
          business_profile_id?: string | null
          estimated_time?: number | null
          estimated_cost?: number | null
          required_parts?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repair_id?: string
          user_id?: string
          business_profile_id?: string | null
          estimated_time?: number | null
          estimated_cost?: number | null
          required_parts?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      completion_records: {
        Row: {
          id: string
          repair_id: string
          user_id: string
          business_profile_id: string | null
          checklist_completed: boolean
          notes: string | null
          notification_sent: boolean
          completed_at: string
        }
        Insert: {
          id?: string
          repair_id: string
          user_id?: string
          business_profile_id?: string | null
          checklist_completed?: boolean
          notes?: string | null
          notification_sent?: boolean
          completed_at?: string
        }
        Update: {
          id?: string
          repair_id?: string
          user_id?: string
          business_profile_id?: string | null
          checklist_completed?: boolean
          notes?: string | null
          notification_sent?: boolean
          completed_at?: string
        }
      }
      repair_photos: {
        Row: {
          id: string
          repair_id: string
          user_id: string
          business_profile_id: string | null
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          repair_id: string
          user_id: string
          business_profile_id?: string | null
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          repair_id?: string
          user_id?: string
          business_profile_id?: string | null
          image_url?: string
          created_at?: string
        }
      }
      repair_status_history: {
        Row: {
          id: string
          repair_id: string
          status: 'accepted' | 'diagnosed' | 'fixed' | 'picked' | 'completed' | 'cancelled'
          changed_at: string
          user_id: string | null
          business_profile_id: string | null
        }
        Insert: {
          id?: string
          repair_id: string
          status: 'accepted' | 'diagnosed' | 'fixed' | 'picked' | 'completed' | 'cancelled'
          changed_at?: string
          user_id?: string | null
          business_profile_id?: string | null
        }
        Update: {
          id?: string
          repair_id?: string
          status?: 'accepted' | 'diagnosed' | 'fixed' | 'picked' | 'completed' | 'cancelled'
          changed_at?: string
          user_id?: string | null
          business_profile_id?: string | null
        }
      }
      pickup_codes: {
        Row: {
          id: string
          repair_id: string
          business_profile_id: string | null
          code: string
          created_at: string
          used_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          repair_id: string
          business_profile_id?: string | null
          code: string
          created_at?: string
          used_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          repair_id?: string
          business_profile_id?: string | null
          code?: string
          created_at?: string
          used_at?: string | null
          is_active?: boolean
        }
      }
      business_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          region: string | null
          city: string | null
          address: string | null
          location: string
          phone: string | null
          master_name: string | null
          logo_url: string | null
          latitude: number | null
          longitude: number | null
          sms_enabled: boolean
          is_price_hidden: boolean
          telegram_chat_id: string | null
          telegram_report_enabled: boolean
          telegram_report_time: string | null
          telegram_linked_at: string | null
          telegram_last_report_date: string | null
          plan: string
          plan_started_at: string | null
          plan_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          region?: string | null
          city?: string | null
          address?: string | null
          location: string
          phone?: string | null
          master_name?: string | null
          logo_url?: string | null
          latitude?: number | null
          longitude?: number | null
          sms_enabled?: boolean
          is_price_hidden?: boolean
          telegram_chat_id?: string | null
          telegram_report_enabled?: boolean
          telegram_report_time?: string | null
          telegram_linked_at?: string | null
          telegram_last_report_date?: string | null
          plan?: string
          plan_started_at?: string | null
          plan_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          region?: string | null
          city?: string | null
          address?: string | null
          location?: string
          phone?: string | null
          master_name?: string | null
          logo_url?: string | null
          latitude?: number | null
          longitude?: number | null
          sms_enabled?: boolean
          is_price_hidden?: boolean
          telegram_chat_id?: string | null
          telegram_report_enabled?: boolean
          telegram_report_time?: string | null
          telegram_linked_at?: string | null
          telegram_last_report_date?: string | null
          plan?: string
          plan_started_at?: string | null
          plan_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          price: number
          duration_days: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          duration_days?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          duration_days?: number
          is_active?: boolean
          created_at?: string
        }
      }
      subscription_history: {
        Row: {
          id: string
          user_id: string
          plan: string
          action: string
          amount: number
          balance_before: number
          balance_after: number
          period_start: string | null
          period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          action: string
          amount?: number
          balance_before?: number
          balance_after?: number
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          action?: string
          amount?: number
          balance_before?: number
          balance_after?: number
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
      }
      expense_types: {
        Row: {
          id: string
          name: string
          business_profile_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_profile_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_profile_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      device_types: {
        Row: {
          id: string
          name: string
          icon: string | null
          business_profile_id: string | null
          is_system: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          business_profile_id?: string | null
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          business_profile_id?: string | null
          is_system?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sms_notifications: {
        Row: {
          id: string
          repair_id: string
          business_profile_id: string | null
          phone_number: string
          message: string
          status: 'sent' | 'delivered' | 'failed'
          message_id: string | null
          notification_type: 'diagnosed' | 'ready' | 'pickup_code' | 'completed' | 'acceptance'
          error_message: string | null
          sent_at: string
          created_at: string
          updated_at: string
          cost: number | null
          charged_at: string | null
          is_charged: boolean
        }
        Insert: {
          id?: string
          repair_id: string
          business_profile_id?: string | null
          phone_number: string
          message: string
          status?: 'sent' | 'delivered' | 'failed'
          message_id?: string | null
          notification_type: 'diagnosed' | 'ready' | 'pickup_code' | 'completed' | 'acceptance'
          error_message?: string | null
          sent_at?: string
          created_at?: string
          updated_at?: string
          cost?: number | null
          charged_at?: string | null
          is_charged?: boolean
        }
        Update: {
          id?: string
          repair_id?: string
          business_profile_id?: string | null
          phone_number?: string
          message?: string
          status?: 'sent' | 'delivered' | 'failed'
          message_id?: string | null
          notification_type?: 'diagnosed' | 'ready' | 'pickup_code' | 'completed' | 'acceptance'
          error_message?: string | null
          sent_at?: string
          created_at?: string
          updated_at?: string
          cost?: number | null
          charged_at?: string | null
          is_charged?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          order_id: number
          user_id: string
          amount: number
          status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
          order_type: 'balance_topup'
          payment_provider: 'payme' | 'click'
          description: string | null
          transaction_id: string | null
          payme_transaction_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: number
          user_id: string
          amount: number
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
          order_type?: 'balance_topup'
          payment_provider?: 'payme' | 'click'
          description?: string | null
          transaction_id?: string | null
          payme_transaction_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: number
          user_id?: string
          amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
          order_type?: 'balance_topup'
          payment_provider?: 'payme' | 'click'
          description?: string | null
          transaction_id?: string | null
          payme_transaction_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_balances: {
        Row: {
          id: string
          user_id: string
          balance_id: number
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance_id?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance_id?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      balance_transactions: {
        Row: {
          id: string
          user_id: string
          sms_notification_id: string | null
          transaction_type: 'sms_charge' | 'topup' | 'refund'
          amount: number
          balance_before: number
          balance_after: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sms_notification_id?: string | null
          transaction_type: 'sms_charge' | 'topup' | 'refund' | 'data_export'
          amount: number
          balance_before: number
          balance_after: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sms_notification_id?: string | null
          transaction_type?: 'sms_charge' | 'topup' | 'refund' | 'data_export'
          amount?: number
          balance_before?: number
          balance_after?: number
          description?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          business_profile_id: string | null
          type: string
          amount: number
          description: string | null
          income_type_id: string | null
          created_at: string
          expense_type_id: string | null
          payment_method: string
        }
        Insert: {
          id?: string
          user_id?: string
          business_profile_id?: string | null
          type: string
          amount: number
          description?: string | null
          income_type_id?: string | null
          created_at?: string
          expense_type_id?: string | null
          payment_method?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_profile_id?: string | null
          type?: string
          amount?: number
          description?: string | null
          income_type_id?: string | null
          created_at?: string
          expense_type_id?: string | null
          payment_method?: string
        }
      }
      income_types: {
        Row: {
          id: string
          name: string
          business_profile_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_profile_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_profile_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      repair_services: {
        Row: {
          id: string
          repair_id: string
          service_name: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          repair_id: string
          service_name: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          repair_id?: string
          service_name?: string
          price?: number
          created_at?: string
        }
      }
      google_drive_tokens: {
        Row: {
          id: string
          user_id: string
          refresh_token: string
          access_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          refresh_token: string
          access_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          refresh_token?: string
          access_token?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      data_exports: {
        Row: {
          id: string
          user_id: string
          export_type: 'download' | 'google_drive'
          file_size: number | null
          google_drive_file_id: string | null
          google_drive_file_url: string | null
          download_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          export_type: 'download' | 'google_drive'
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_file_url?: string | null
          download_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          export_type?: 'download' | 'google_drive'
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_file_url?: string | null
          download_url?: string | null
          created_at?: string
        }
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
  }
}
