export interface Database {
  public: {
    Tables: {
      nominators: {
        Row: {
          id: string;
          email: string;
          firstname: string;
          lastname: string;
          linkedin: string | null;
          company: string | null;
          job_title: string | null;
          phone: string | null;
          country: string | null;
          loops_contact_id: string | null;
          loops_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          firstname: string;
          lastname: string;
          linkedin?: string | null;
          company?: string | null;
          job_title?: string | null;
          phone?: string | null;
          country?: string | null;
          loops_contact_id?: string | null;
          loops_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          firstname?: string;
          lastname?: string;
          linkedin?: string | null;
          company?: string | null;
          job_title?: string | null;
          phone?: string | null;
          country?: string | null;
          loops_contact_id?: string | null;
          loops_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      nominees: {
        Row: {
          id: string;
          type: 'person' | 'company';
          // Person fields
          firstname: string | null;
          lastname: string | null;
          person_email: string | null;
          person_linkedin: string | null;
          person_phone: string | null;
          jobtitle: string | null;
          person_company: string | null;
          person_country: string | null;
          headshot_url: string | null;
          why_me: string | null;
          // Company fields
          company_name: string | null;
          company_domain: string | null;
          company_website: string | null;
          company_linkedin: string | null;
          company_phone: string | null;
          company_country: string | null;
          company_size: string | null;
          company_industry: string | null;
          logo_url: string | null;
          why_us: string | null;
          // Shared fields
          live_url: string | null;
          bio: string | null;
          achievements: string | null;
          social_media: any; // JSONB
          loops_contact_id: string | null;
          loops_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'person' | 'company';
          firstname?: string | null;
          lastname?: string | null;
          person_email?: string | null;
          person_linkedin?: string | null;
          person_phone?: string | null;
          jobtitle?: string | null;
          person_company?: string | null;
          person_country?: string | null;
          headshot_url?: string | null;
          why_me?: string | null;
          company_name?: string | null;
          company_domain?: string | null;
          company_website?: string | null;
          company_linkedin?: string | null;
          company_phone?: string | null;
          company_country?: string | null;
          company_size?: string | null;
          company_industry?: string | null;
          logo_url?: string | null;
          why_us?: string | null;
          live_url?: string | null;
          bio?: string | null;
          achievements?: string | null;
          social_media?: any;
          loops_contact_id?: string | null;
          loops_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'person' | 'company';
          firstname?: string | null;
          lastname?: string | null;
          person_email?: string | null;
          person_linkedin?: string | null;
          person_phone?: string | null;
          jobtitle?: string | null;
          person_company?: string | null;
          person_country?: string | null;
          headshot_url?: string | null;
          why_me?: string | null;
          company_name?: string | null;
          company_domain?: string | null;
          company_website?: string | null;
          company_linkedin?: string | null;
          company_phone?: string | null;
          company_country?: string | null;
          company_size?: string | null;
          company_industry?: string | null;
          logo_url?: string | null;
          why_us?: string | null;
          live_url?: string | null;
          bio?: string | null;
          achievements?: string | null;
          social_media?: any;
          loops_contact_id?: string | null;
          loops_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      nominations: {
        Row: {
          id: string;
          nominator_id: string;
          nominee_id: string;
          category_group_id: string;
          subcategory_id: string;
          state: 'submitted' | 'approved' | 'rejected';
          votes: number;
          admin_notes: string | null;
          rejection_reason: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nominator_id: string;
          nominee_id: string;
          category_group_id: string;
          subcategory_id: string;
          state?: 'submitted' | 'approved' | 'rejected';
          votes?: number;
          admin_notes?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nominator_id?: string;
          nominee_id?: string;
          category_group_id?: string;
          subcategory_id?: string;
          state?: 'submitted' | 'approved' | 'rejected';
          votes?: number;
          admin_notes?: string | null;
          rejection_reason?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      voters: {
        Row: {
          id: string;
          email: string;
          firstname: string;
          lastname: string;
          linkedin: string;
          company: string | null;
          job_title: string | null;
          country: string | null;
          loops_contact_id: string | null;
          loops_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          firstname: string;
          lastname: string;
          linkedin: string;
          company?: string | null;
          job_title?: string | null;
          country?: string | null;
          loops_contact_id?: string | null;
          loops_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          firstname?: string;
          lastname?: string;
          linkedin?: string;
          company?: string | null;
          job_title?: string | null;
          country?: string | null;
          loops_contact_id?: string | null;
          loops_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          voter_id: string;
          nomination_id: string;
          subcategory_id: string;
          vote_timestamp: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          nomination_id: string;
          subcategory_id: string;
          vote_timestamp?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          nomination_id?: string;
          subcategory_id?: string;
          vote_timestamp?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      hubspot_outbox: {
        Row: {
          id: string;
          event_type: 'nomination_submitted' | 'nomination_approved' | 'vote_cast';
          payload: any; // JSONB
          status: 'pending' | 'processing' | 'done' | 'dead';
          attempt_count: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_type: 'nomination_submitted' | 'nomination_approved' | 'vote_cast';
          payload: any;
          status?: 'pending' | 'processing' | 'done' | 'dead';
          attempt_count?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_type?: 'nomination_submitted' | 'nomination_approved' | 'vote_cast';
          payload?: any;
          status?: 'pending' | 'processing' | 'done' | 'dead';
          attempt_count?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      public_nominees: {
        Row: {
          nomination_id: string;
          nominee_id: string;
          type: 'person' | 'company';
          subcategory_id: string;
          category_group_id: string;
          display_name: string;
          image_url: string | null;
          title_or_industry: string | null;
          linkedin_url: string | null;
          why_vote: string | null;
          live_url: string | null;
          votes: number;
          created_at: string;
          approved_at: string | null;
        };
      };
      admin_nominations: {
        Row: {
          nomination_id: string;
          state: 'submitted' | 'approved' | 'rejected';
          votes: number;
          subcategory_id: string;
          category_group_id: string;
          admin_notes: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
          approved_by: string | null;
          nominee_id: string;
          nominee_type: 'person' | 'company';
          nominee_firstname: string | null;
          nominee_lastname: string | null;
          nominee_email: string | null;
          nominee_linkedin: string | null;
          nominee_jobtitle: string | null;
          headshot_url: string | null;
          why_me: string | null;
          company_name: string | null;
          company_website: string | null;
          company_linkedin: string | null;
          logo_url: string | null;
          why_us: string | null;
          live_url: string | null;
          nominee_display_name: string;
          nominee_image_url: string | null;
          nominator_id: string;
          nominator_email: string;
          nominator_firstname: string;
          nominator_lastname: string;
          nominator_linkedin: string | null;
          nominator_company: string | null;
          nominator_job_title: string | null;
        };
      };
      voting_stats: {
        Row: {
          subcategory_id: string;
          category_group_id: string;
          total_votes: number;
          unique_voters: number;
          latest_vote: string | null;
          first_vote: string | null;
        };
      };
    };
  };
}