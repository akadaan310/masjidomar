
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "announcements": {
                  Row: {
                    "audience": Database["public"]['Enums']["audience"],"body_ar_md": string,"body_md": string,"created_at": string,"created_by": string | null,"expires_at": string | null,"id": string,"is_sample": boolean,"publish_at": string,"show_on_display": boolean,"slug": string,"status": Database["public"]['Enums']["content_status"],"title": string,"title_ar": string,"updated_at": string,"urgency": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: Database["public"]['Enums']["audience"],"body_ar_md"?: string,"body_md"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"is_sample"?: boolean,"publish_at"?: string,"show_on_display"?: boolean,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"title_ar"?: string,"updated_at"?: string,"urgency"?: string
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["audience"],"body_ar_md"?: string,"body_md"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"is_sample"?: boolean,"publish_at"?: string,"show_on_display"?: boolean,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"title_ar"?: string,"updated_at"?: string,"urgency"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_events": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": number,"metadata": NonNullable<Json>,"target_id": string,"target_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"target_id"?: string,"target_type"?: string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"target_id"?: string,"target_type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"data_requests": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"note": string,"resolved_at": string | null,"resolved_by": string | null,"status": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"note"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"note"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"status"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"display_presets": {
                  Row: {
                    "id": boolean,"language_mode": string,"panels": NonNullable<Json>,"quiet_mode": boolean,"show_seconds": boolean,"theme": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"language_mode"?: string,"panels"?: NonNullable<Json>,"quiet_mode"?: boolean,"show_seconds"?: boolean,"theme"?: string,"updated_at"?: string
                  }
                  Update: {
                    "id"?: boolean,"language_mode"?: string,"panels"?: NonNullable<Json>,"quiet_mode"?: boolean,"show_seconds"?: boolean,"theme"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"event_registrations": {
                  Row: {
                    "contact_consent": boolean,"created_at": string,"event_id": string,"id": string,"party_size": number,"reminder_opt_in": boolean,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_consent"?: boolean,"created_at"?: string,"event_id": string,"id"?: string,"party_size"?: number,"reminder_opt_in"?: boolean,"status": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "contact_consent"?: boolean,"created_at"?: string,"event_id"?: string,"id"?: string,"party_size"?: number,"reminder_opt_in"?: boolean,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "cancel_note": string,"capacity": number | null,"created_at": string,"description_md": string,"ends_at": string,"id": string,"is_sample": boolean,"location": string,"program_id": string | null,"rsvp_enabled": boolean,"slug": string,"starts_at": string,"status": string,"title": string,"title_ar": string,"updated_at": string,"waitlist_enabled": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_note"?: string,"capacity"?: number | null,"created_at"?: string,"description_md"?: string,"ends_at": string,"id"?: string,"is_sample"?: boolean,"location"?: string,"program_id"?: string | null,"rsvp_enabled"?: boolean,"slug": string,"starts_at": string,"status"?: string,"title": string,"title_ar"?: string,"updated_at"?: string,"waitlist_enabled"?: boolean
                  }
                  Update: {
                    "cancel_note"?: string,"capacity"?: number | null,"created_at"?: string,"description_md"?: string,"ends_at"?: string,"id"?: string,"is_sample"?: boolean,"location"?: string,"program_id"?: string | null,"rsvp_enabled"?: boolean,"slug"?: string,"starts_at"?: string,"status"?: string,"title"?: string,"title_ar"?: string,"updated_at"?: string,"waitlist_enabled"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"faq_proposals": {
                  Row: {
                    "answer_md": string,"category": string,"created_at": string,"id": string,"language": Database["public"]['Enums']["ui_language"],"proposed_by": string | null,"question_text": string,"review_note": string,"reviewed_at": string | null,"reviewed_by": string | null,"source_question_id": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_md": string,"category"?: string,"created_at"?: string,"id"?: string,"language"?: Database["public"]['Enums']["ui_language"],"proposed_by"?: string | null,"question_text": string,"review_note"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"source_question_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "answer_md"?: string,"category"?: string,"created_at"?: string,"id"?: string,"language"?: Database["public"]['Enums']["ui_language"],"proposed_by"?: string | null,"question_text"?: string,"review_note"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"source_question_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "faq_proposals_source_question_id_fkey"
      columns: ["source_question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"iqamah_schedules": {
                  Row: {
                    "created_at": string,"id": string,"mode": Database["public"]['Enums']["iqamah_mode"],"offset_minutes": number | null,"prayer": Database["public"]['Enums']["prayer_name"],"publication_id": string,"time_of_day": string | null,"updated_at": string,"weekday": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"mode"?: Database["public"]['Enums']["iqamah_mode"],"offset_minutes"?: number | null,"prayer": Database["public"]['Enums']["prayer_name"],"publication_id": string,"time_of_day"?: string | null,"updated_at"?: string,"weekday"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"mode"?: Database["public"]['Enums']["iqamah_mode"],"offset_minutes"?: number | null,"prayer"?: Database["public"]['Enums']["prayer_name"],"publication_id"?: string,"time_of_day"?: string | null,"updated_at"?: string,"weekday"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "iqamah_schedules_publication_id_fkey"
      columns: ["publication_id"]
isOneToOne: false
      referencedRelation: "prayer_publications"
      referencedColumns: ["id"]
    }
                  ]
                },"jumuah_sessions": {
                  Row: {
                    "created_at": string,"id": string,"iqamah_time": string,"khutbah_time": string,"label": string,"language": string,"note": string,"publication_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"iqamah_time": string,"khutbah_time": string,"label"?: string,"language"?: string,"note"?: string,"publication_id": string,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"iqamah_time"?: string,"khutbah_time"?: string,"label"?: string,"language"?: string,"note"?: string,"publication_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "jumuah_sessions_publication_id_fkey"
      columns: ["publication_id"]
isOneToOne: false
      referencedRelation: "prayer_publications"
      referencedColumns: ["id"]
    }
                  ]
                },"media_assets": {
                  Row: {
                    "ai_generated": boolean,"alt_text": string,"alt_text_ar": string,"created_at": string,"credit": string,"id": string,"people_consent": string,"privacy_tier": string,"publish_approved": boolean,"rights_cleared": boolean,"source": string,"storage_path": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_generated"?: boolean,"alt_text": string,"alt_text_ar"?: string,"created_at"?: string,"credit"?: string,"id"?: string,"people_consent"?: string,"privacy_tier"?: string,"publish_approved"?: boolean,"rights_cleared"?: boolean,"source": string,"storage_path": string,"updated_at"?: string
                  }
                  Update: {
                    "ai_generated"?: boolean,"alt_text"?: string,"alt_text_ar"?: string,"created_at"?: string,"credit"?: string,"id"?: string,"people_consent"?: string,"privacy_tier"?: string,"publish_approved"?: boolean,"rights_cleared"?: boolean,"source"?: string,"storage_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_outbox": {
                  Row: {
                    "channel": string,"created_at": string,"id": string,"ref_id": string | null,"status": string,"template": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": string,"created_at"?: string,"id"?: string,"ref_id"?: string | null,"status"?: string,"template": string,"user_id": string
                  }
                  Update: {
                    "channel"?: string,"created_at"?: string,"id"?: string,"ref_id"?: string | null,"status"?: string,"template"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_preferences": {
                  Row: {
                    "email_announcements": boolean,"email_event_reminders": boolean,"email_question_updates": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "email_announcements"?: boolean,"email_event_reminders"?: boolean,"email_question_updates"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "email_announcements"?: boolean,"email_event_reminders"?: boolean,"email_question_updates"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"prayer_methods": {
                  Row: {
                    "code": string,"description": string,"label": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"description"?: string,"label": string,"sort_order"?: number
                  }
                  Update: {
                    "code"?: string,"description"?: string,"label"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"prayer_overrides": {
                  Row: {
                    "created_at": string,"id": string,"iqamah_time": string | null,"kind": string,"note": string,"on_date": string,"prayer": Database["public"]['Enums']["prayer_name"],"publication_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"iqamah_time"?: string | null,"kind"?: string,"note"?: string,"on_date": string,"prayer": Database["public"]['Enums']["prayer_name"],"publication_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"iqamah_time"?: string | null,"kind"?: string,"note"?: string,"on_date"?: string,"prayer"?: Database["public"]['Enums']["prayer_name"],"publication_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayer_overrides_publication_id_fkey"
      columns: ["publication_id"]
isOneToOne: false
      referencedRelation: "prayer_publications"
      referencedColumns: ["id"]
    }
                  ]
                },"prayer_publications": {
                  Row: {
                    "adjustments": NonNullable<Json>,"calculation_method": string,"created_at": string,"created_by": string | null,"effective_from": string,"id": string,"is_sample": boolean,"madhab": string,"notice": string,"published_at": string | null,"published_by": string | null,"status": Database["public"]['Enums']["publication_status"],"title": string,"updated_at": string,"verified_at": string | null,"verified_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "adjustments"?: NonNullable<Json>,"calculation_method"?: string,"created_at"?: string,"created_by"?: string | null,"effective_from"?: string,"id"?: string,"is_sample"?: boolean,"madhab"?: string,"notice"?: string,"published_at"?: string | null,"published_by"?: string | null,"status"?: Database["public"]['Enums']["publication_status"],"title"?: string,"updated_at"?: string,"verified_at"?: string | null,"verified_by"?: string | null,"version"?: never
                  }
                  Update: {
                    "adjustments"?: NonNullable<Json>,"calculation_method"?: string,"created_at"?: string,"created_by"?: string | null,"effective_from"?: string,"id"?: string,"is_sample"?: boolean,"madhab"?: string,"notice"?: string,"published_at"?: string | null,"published_by"?: string | null,"status"?: Database["public"]['Enums']["publication_status"],"title"?: string,"updated_at"?: string,"verified_at"?: string | null,"verified_by"?: string | null,"version"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayer_publications_calculation_method_fkey"
      columns: ["calculation_method"]
isOneToOne: false
      referencedRelation: "prayer_methods"
      referencedColumns: ["code"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"preferred_language": Database["public"]['Enums']["ui_language"],"privacy_consent_at": string | null,"status": Database["public"]['Enums']["account_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string,"id": string,"preferred_language"?: Database["public"]['Enums']["ui_language"],"privacy_consent_at"?: string | null,"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"preferred_language"?: Database["public"]['Enums']["ui_language"],"privacy_consent_at"?: string | null,"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"programs": {
                  Row: {
                    "audience_note": string,"category": string,"created_at": string,"description_md": string,"id": string,"is_sample": boolean,"schedule_note": string,"slug": string,"status": Database["public"]['Enums']["content_status"],"summary": string,"title": string,"title_ar": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience_note"?: string,"category"?: string,"created_at"?: string,"description_md"?: string,"id"?: string,"is_sample"?: boolean,"schedule_note"?: string,"slug": string,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string,"title": string,"title_ar"?: string,"updated_at"?: string
                  }
                  Update: {
                    "audience_note"?: string,"category"?: string,"created_at"?: string,"description_md"?: string,"id"?: string,"is_sample"?: boolean,"schedule_note"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string,"title"?: string,"title_ar"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"public_faq": {
                  Row: {
                    "answer_md": string,"approved_at": string | null,"approved_by_imam": string | null,"category": string,"created_at": string,"id": string,"is_sample": boolean,"language": Database["public"]['Enums']["ui_language"],"question": string,"sort_order": number,"source_proposal_id": string | null,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_md": string,"approved_at"?: string | null,"approved_by_imam"?: string | null,"category"?: string,"created_at"?: string,"id"?: string,"is_sample"?: boolean,"language"?: Database["public"]['Enums']["ui_language"],"question": string,"sort_order"?: number,"source_proposal_id"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "answer_md"?: string,"approved_at"?: string | null,"approved_by_imam"?: string | null,"category"?: string,"created_at"?: string,"id"?: string,"is_sample"?: boolean,"language"?: Database["public"]['Enums']["ui_language"],"question"?: string,"sort_order"?: number,"source_proposal_id"?: string | null,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"question_internal_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"question_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"question_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"question_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_internal_notes_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"question_messages": {
                  Row: {
                    "author_id": string | null,"author_kind": string,"body": string,"created_at": string,"edited_at": string | null,"id": string,"is_draft": boolean,"kind": string,"published_at": string | null,"question_id": string,"read_by_member_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"author_kind": string,"body": string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"is_draft"?: boolean,"kind": string,"published_at"?: string | null,"question_id": string,"read_by_member_at"?: string | null
                  }
                  Update: {
                    "author_id"?: string | null,"author_kind"?: string,"body"?: string,"created_at"?: string,"edited_at"?: string | null,"id"?: string,"is_draft"?: boolean,"kind"?: string,"published_at"?: string | null,"question_id"?: string,"read_by_member_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_messages_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"question_status_history": {
                  Row: {
                    "changed_by": string | null,"changed_by_kind": string,"created_at": string,"from_status": Database["public"]['Enums']["question_status"] | null,"id": number,"question_id": string,"to_status": Database["public"]['Enums']["question_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by"?: string | null,"changed_by_kind": string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["question_status"] | null,"id"?: never,"question_id": string,"to_status": Database["public"]['Enums']["question_status"]
                  }
                  Update: {
                    "changed_by"?: string | null,"changed_by_kind"?: string,"created_at"?: string,"from_status"?: Database["public"]['Enums']["question_status"] | null,"id"?: never,"question_id"?: string,"to_status"?: Database["public"]['Enums']["question_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_status_history_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "asker_id": string,"assigned_imam_id": string | null,"body": string,"category": Database["public"]['Enums']["question_category"],"closed_at": string | null,"created_at": string,"faq_consent": boolean,"followups_allowed": boolean,"id": string,"is_sample": boolean,"is_sensitive": boolean,"language": Database["public"]['Enums']["ui_language"],"last_member_activity_at": string,"last_staff_activity_at": string | null,"show_name_to_imam": boolean,"status": Database["public"]['Enums']["question_status"],"subject": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "asker_id": string,"assigned_imam_id"?: string | null,"body": string,"category": Database["public"]['Enums']["question_category"],"closed_at"?: string | null,"created_at"?: string,"faq_consent"?: boolean,"followups_allowed"?: boolean,"id"?: string,"is_sample"?: boolean,"is_sensitive"?: boolean,"language"?: Database["public"]['Enums']["ui_language"],"last_member_activity_at"?: string,"last_staff_activity_at"?: string | null,"show_name_to_imam"?: boolean,"status"?: Database["public"]['Enums']["question_status"],"subject": string,"updated_at"?: string
                  }
                  Update: {
                    "asker_id"?: string,"assigned_imam_id"?: string | null,"body"?: string,"category"?: Database["public"]['Enums']["question_category"],"closed_at"?: string | null,"created_at"?: string,"faq_consent"?: boolean,"followups_allowed"?: boolean,"id"?: string,"is_sample"?: boolean,"is_sensitive"?: boolean,"language"?: Database["public"]['Enums']["ui_language"],"last_member_activity_at"?: string,"last_staff_activity_at"?: string | null,"show_name_to_imam"?: boolean,"status"?: Database["public"]['Enums']["question_status"],"subject"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"saved_items": {
                  Row: {
                    "created_at": string,"item_id": string,"item_type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"item_id": string,"item_type": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"item_id"?: string,"item_type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings_revisions": {
                  Row: {
                    "after": NonNullable<Json>,"before": NonNullable<Json>,"changed_at": string,"changed_by": string | null,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "after": NonNullable<Json>,"before": NonNullable<Json>,"changed_at"?: string,"changed_by"?: string | null,"id"?: never
                  }
                  Update: {
                    "after"?: NonNullable<Json>,"before"?: NonNullable<Json>,"changed_at"?: string,"changed_by"?: string | null,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "accessibility_info": string,"accessibility_verified": boolean,"address_line": string,"allow_indexing": boolean,"city": string,"concept_mode": boolean,"default_language": Database["public"]['Enums']["ui_language"],"email": string,"email_verified": boolean,"giving_info": string,"giving_verified": boolean,"hero_media_id": string | null,"hero_source": string,"id": boolean,"imam_hours_note": string,"imam_shared_queue": boolean,"latitude": number,"longitude": number,"notification_mode": string,"org_name_ar": string,"org_name_en": string,"parking_info": string,"parking_verified": boolean,"phone": string,"phone_verified": boolean,"postal_code": string,"question_retention_days": number,"region": string,"require_staff_mfa": boolean,"secondary_language": Database["public"]['Enums']["ui_language"],"support_escalation_url": string,"timezone": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accessibility_info"?: string,"accessibility_verified"?: boolean,"address_line"?: string,"allow_indexing"?: boolean,"city"?: string,"concept_mode"?: boolean,"default_language"?: Database["public"]['Enums']["ui_language"],"email"?: string,"email_verified"?: boolean,"giving_info"?: string,"giving_verified"?: boolean,"hero_media_id"?: string | null,"hero_source"?: string,"id"?: boolean,"imam_hours_note"?: string,"imam_shared_queue"?: boolean,"latitude"?: number,"longitude"?: number,"notification_mode"?: string,"org_name_ar"?: string,"org_name_en"?: string,"parking_info"?: string,"parking_verified"?: boolean,"phone"?: string,"phone_verified"?: boolean,"postal_code"?: string,"question_retention_days"?: number,"region"?: string,"require_staff_mfa"?: boolean,"secondary_language"?: Database["public"]['Enums']["ui_language"],"support_escalation_url"?: string,"timezone"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "accessibility_info"?: string,"accessibility_verified"?: boolean,"address_line"?: string,"allow_indexing"?: boolean,"city"?: string,"concept_mode"?: boolean,"default_language"?: Database["public"]['Enums']["ui_language"],"email"?: string,"email_verified"?: boolean,"giving_info"?: string,"giving_verified"?: boolean,"hero_media_id"?: string | null,"hero_source"?: string,"id"?: boolean,"imam_hours_note"?: string,"imam_shared_queue"?: boolean,"latitude"?: number,"longitude"?: number,"notification_mode"?: string,"org_name_ar"?: string,"org_name_en"?: string,"parking_info"?: string,"parking_verified"?: boolean,"phone"?: string,"phone_verified"?: boolean,"postal_code"?: string,"question_retention_days"?: number,"region"?: string,"require_staff_mfa"?: boolean,"secondary_language"?: Database["public"]['Enums']["ui_language"],"support_escalation_url"?: string,"timezone"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"staff_roles": {
                  Row: {
                    "assigned_at": string,"assigned_by": string | null,"id": string,"revoked_at": string | null,"revoked_by": string | null,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"id"?: string,"revoked_at"?: string | null,"revoked_by"?: string | null,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  Update: {
                    "assigned_at"?: string,"assigned_by"?: string | null,"id"?: string,"revoked_at"?: string | null,"revoked_by"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"volunteer_inquiries": {
                  Row: {
                    "consent_contact": boolean,"contact_preference": string,"created_at": string,"id": string,"message": string,"opportunity_id": string | null,"status": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "consent_contact": boolean,"contact_preference"?: string,"created_at"?: string,"id"?: string,"message"?: string,"opportunity_id"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "consent_contact"?: boolean,"contact_preference"?: string,"created_at"?: string,"id"?: string,"message"?: string,"opportunity_id"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "volunteer_inquiries_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "volunteer_opportunities"
      referencedColumns: ["id"]
    }
                  ]
                },"volunteer_inquiry_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"inquiry_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"inquiry_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"inquiry_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "volunteer_inquiry_notes_inquiry_id_fkey"
      columns: ["inquiry_id"]
isOneToOne: false
      referencedRelation: "volunteer_inquiries"
      referencedColumns: ["id"]
    }
                  ]
                },"volunteer_opportunities": {
                  Row: {
                    "commitment": string,"created_at": string,"description_md": string,"id": string,"is_sample": boolean,"status": Database["public"]['Enums']["content_status"],"title": string,"title_ar": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "commitment"?: string,"created_at"?: string,"description_md"?: string,"id"?: string,"is_sample"?: boolean,"status"?: Database["public"]['Enums']["content_status"],"title": string,"title_ar"?: string,"updated_at"?: string
                  }
                  Update: {
                    "commitment"?: string,"created_at"?: string,"description_md"?: string,"id"?: string,"is_sample"?: boolean,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"title_ar"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_assign_question":
{ Args: { "p_imam_id": string,"p_question_id": string }; Returns: undefined
                           },
"admin_grant_role":
{ Args: { "p_role": Database["public"]['Enums']["staff_role"],"p_user_id": string }; Returns: undefined
                           },
"admin_member_list":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_search"?: string }; Returns: {
              "created_at": string,"display_name": string,"email": string,"email_confirmed": boolean,"id": string,"roles": (Database["public"]['Enums']["staff_role"])[],"status": Database["public"]['Enums']["account_status"]
            }[]
                           },
"admin_open_question":
{ Args: { "p_question_id": string,"p_reason": string }; Returns: {
              "body": string,"created_at": string,"status": Database["public"]['Enums']["question_status"],"subject": string
            }[]
                           },
"admin_question_overview":
{ Args: Record<PropertyKey, never>; Returns: {
              "category": Database["public"]['Enums']["question_category"],"oldest_waiting_hours": number,"sensitive": number,"status": Database["public"]['Enums']["question_status"],"total": number,"unassigned": number
            }[]
                           },
"admin_question_queue":
{ Args: { "p_limit"?: number }; Returns: {
              "assigned_imam_id": string,"assigned_imam_name": string,"category": Database["public"]['Enums']["question_category"],"created_at": string,"id": string,"is_sensitive": boolean,"language": Database["public"]['Enums']["ui_language"],"status": Database["public"]['Enums']["question_status"],"waiting_hours": number
            }[]
                           },
"admin_resolve_data_request":
{ Args: { "p_id": string,"p_note"?: string,"p_status": string }; Returns: undefined
                           },
"admin_revoke_role":
{ Args: { "p_role": Database["public"]['Enums']["staff_role"],"p_user_id": string }; Returns: undefined
                           },
"admin_set_account_status":
{ Args: { "p_status": Database["public"]['Enums']["account_status"],"p_user_id": string }; Returns: undefined
                           },
"admin_staff_list":
{ Args: Record<PropertyKey, never>; Returns: {
              "assigned_at": string,"display_name": string,"role": Database["public"]['Enums']["staff_role"],"user_id": string
            }[]
                           },
"admin_today_summary":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"cancel_rsvp":
{ Args: { "p_event_id": string }; Returns: undefined
                           },
"create_prayer_draft":
{ Args: { "p_from"?: string }; Returns: string
                           },
"event_rsvp_totals":
{ Args: { "p_event_ids": (string)[] }; Returns: {
              "confirmed": number,"event_id": string,"waitlisted": number
            }[]
                           },
"export_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"imam_acknowledge":
{ Args: { "p_question_id": string }; Returns: undefined
                           },
"imam_add_note":
{ Args: { "p_body": string,"p_question_id": string }; Returns: string
                           },
"imam_claim":
{ Args: { "p_question_id": string }; Returns: undefined
                           },
"imam_discard_draft":
{ Args: { "p_question_id": string }; Returns: undefined
                           },
"imam_inbox":
{ Args: { "p_category"?: Database["public"]['Enums']["question_category"],"p_language"?: Database["public"]['Enums']["ui_language"],"p_show_sensitive_excerpts"?: boolean,"p_status"?: Database["public"]['Enums']["question_status"] }; Returns: {
              "asker_label": string,"assigned_to_me": boolean,"category": Database["public"]['Enums']["question_category"],"created_at": string,"excerpt": string,"id": string,"is_sensitive": boolean,"language": Database["public"]['Enums']["ui_language"],"last_member_activity_at": string,"status": Database["public"]['Enums']["question_status"],"subject": string,"waiting_hours": number
            }[]
                           },
"imam_propose_faq":
{ Args: { "p_answer_md": string,"p_category": string,"p_language": Database["public"]['Enums']["ui_language"],"p_question_id": string,"p_question_text": string }; Returns: string
                           },
"imam_question_asker_label":
{ Args: { "p_question_id": string }; Returns: string
                           },
"imam_save_draft":
{ Args: { "p_body": string,"p_kind"?: string,"p_question_id": string }; Returns: string
                           },
"imam_send_draft":
{ Args: { "p_allow_followups"?: boolean,"p_question_id": string }; Returns: undefined
                           },
"imam_set_hours_note":
{ Args: { "p_note": string }; Returns: undefined
                           },
"imam_set_status":
{ Args: { "p_question_id": string,"p_status": Database["public"]['Enums']["question_status"] }; Returns: undefined
                           },
"member_close_question":
{ Args: { "p_question_id": string }; Returns: undefined
                           },
"member_edit_message":
{ Args: { "p_body": string,"p_message_id": string }; Returns: undefined
                           },
"member_edit_question":
{ Args: { "p_body": string,"p_question_id": string,"p_subject": string }; Returns: undefined
                           },
"member_mark_read":
{ Args: { "p_question_id": string }; Returns: undefined
                           },
"member_reply":
{ Args: { "p_body": string,"p_question_id": string }; Returns: string
                           },
"my_questions":
{ Args: Record<PropertyKey, never>; Returns: {
              "category": Database["public"]['Enums']["question_category"],"created_at": string,"id": string,"status": Database["public"]['Enums']["question_status"],"subject": string,"unread": number,"updated_at": string
            }[]
                           },
"my_roles":
{ Args: Record<PropertyKey, never>; Returns: (Database["public"]['Enums']["staff_role"])[]
                           },
"publish_prayer_publication":
{ Args: { "p_id": string,"p_verified": boolean }; Returns: undefined
                           },
"review_faq_proposal":
{ Args: { "p_approve": boolean,"p_id": string,"p_note"?: string }; Returns: string
                           },
"rsvp_event":
{ Args: { "p_contact_consent": boolean,"p_event_id": string,"p_party_size": number,"p_reminder_opt_in": boolean }; Returns: string
                           },
"submit_question":
{ Args: { "p_body": string,"p_category": Database["public"]['Enums']["question_category"],"p_faq_consent": boolean,"p_is_sensitive": boolean,"p_language": Database["public"]['Enums']["ui_language"],"p_show_name": boolean,"p_subject": string }; Returns: string
                           }
          }
          Enums: {
            "account_status": "active"|"disabled","audience": "public"|"members"|"staff","content_status": "draft"|"published"|"archived","iqamah_mode": "fixed"|"offset","prayer_name": "fajr"|"dhuhr"|"asr"|"maghrib"|"isha","publication_status": "draft"|"published"|"archived","question_category": "worship"|"family"|"new_muslim"|"community"|"other","question_status": "submitted"|"acknowledged"|"needs_clarification"|"answered"|"closed","staff_role": "admin"|"imam"|"editor"|"moderator","ui_language": "en"|"ar"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_status": ["active", "disabled"],"audience": ["public", "members", "staff"],"content_status": ["draft", "published", "archived"],"iqamah_mode": ["fixed", "offset"],"prayer_name": ["fajr", "dhuhr", "asr", "maghrib", "isha"],"publication_status": ["draft", "published", "archived"],"question_category": ["worship", "family", "new_muslim", "community", "other"],"question_status": ["submitted", "acknowledged", "needs_clarification", "answered", "closed"],"staff_role": ["admin", "imam", "editor", "moderator"],"ui_language": ["en", "ar"]
          }
        }
} as const
