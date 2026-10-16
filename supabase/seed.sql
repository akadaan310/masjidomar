-- LOCAL / STAGING DEMO SEED ONLY. `supabase db reset` runs this; `supabase db push` to a hosted
-- project does not. Every row here is flagged is_sample = true and is only publicly visible while
-- site_settings.concept_mode = true. None of it is information supplied or approved by Masjid Omar.

-- Sample prayer schedule (published so the demo has something to show; banner says it is a demo).
select set_config('app.publishing', 'on', false);
insert into public.prayer_publications (id, status, title, calculation_method, madhab, effective_from, notice, is_sample, published_at, verified_at)
values ('00000000-0000-4000-8000-000000000001', 'published', 'Demo schedule', 'NorthAmerica', 'shafi',
        current_date - 30, 'Demo schedule — not current prayer times. Iqamah times must be set by the masjid.', true, now(), null);
select set_config('app.publishing', 'off', false);

-- Children are inserted while the publication is still a draft-equivalent: temporarily allow via direct
-- session flag on the guard (seed runs as postgres, bypassing RLS but not triggers).
alter table public.iqamah_schedules disable trigger iqamah_guard;
alter table public.jumuah_sessions disable trigger jumuah_guard;
insert into public.iqamah_schedules (publication_id, prayer, weekday, mode, time_of_day, offset_minutes) values
  ('00000000-0000-4000-8000-000000000001', 'fajr', null, 'offset', null, 20),
  ('00000000-0000-4000-8000-000000000001', 'dhuhr', null, 'fixed', '13:45', null),
  ('00000000-0000-4000-8000-000000000001', 'asr', null, 'offset', null, 15),
  ('00000000-0000-4000-8000-000000000001', 'maghrib', null, 'offset', null, 5),
  ('00000000-0000-4000-8000-000000000001', 'isha', null, 'offset', null, 15);
insert into public.jumuah_sessions (publication_id, label, khutbah_time, iqamah_time, language, note, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'Jumu''ah (sample)', '13:30', '14:00', 'English & Arabic', 'Sample only — confirm with the masjid.', 1);
alter table public.iqamah_schedules enable trigger iqamah_guard;
alter table public.jumuah_sessions enable trigger jumuah_guard;

-- Concept imagery (AI-assisted; disclosed everywhere it appears).
insert into public.media_assets (storage_path, alt_text, alt_text_ar, credit, source, ai_generated, rights_cleared, privacy_tier, publish_approved) values
  ('/images/concept/masjid-omar-concept-exterior-sunset.webp',
   'Concept visualization of a low, welcoming masjid entrance with glass doors at sunset',
   'تصور مفاهيمي لمدخل مسجد بأبواب زجاجية عند الغروب',
   'AI-assisted concept image — not a photograph of Masjid Omar', 'ai_concept', true, false, 'public', false),
  ('/images/concept/masjid-omar-concept-prayer-hall.webp',
   'Concept visualization of a calm prayer hall with blue carpet rows and a wooden mihrab',
   'تصور مفاهيمي لمصلى هادئ بسجاد أزرق ومحراب خشبي',
   'AI-assisted concept image — not a photograph of Masjid Omar', 'ai_concept', true, false, 'public', false);

insert into public.announcements (slug, title, title_ar, body_md, urgency, status, publish_at, is_sample) values
  ('sample-welcome-preview', 'Sample: this is a private website preview', 'نموذج: هذه معاينة خاصة للموقع',
   'This announcement is **sample content** created for a private demonstration. Real announcements are written and published by masjid administrators.',
   'normal', 'published', now() - interval '2 days', true),
  ('sample-parking-reminder', 'Sample: parking reminder for Jumu''ah', 'نموذج: تذكير بشأن مواقف السيارات',
   'Sample text showing how a short practical reminder would appear. Parking arrangements have **not** been confirmed with the masjid.',
   'normal', 'published', now() - interval '1 day', true),
  ('sample-urgent-notice', 'Sample urgent notice (demo only)', 'إشعار عاجل نموذجي',
   'Urgent notices appear in a highlighted band and on the masjid display. This is a demonstration only.',
   'urgent', 'draft', now(), true);

insert into public.programs (slug, title, title_ar, summary, description_md, category, schedule_note, audience_note, status, is_sample) values
  ('sample-quran-reading-circle', 'Sample: Qur''an reading circle', 'نموذج: حلقة تلاوة',
   'Placeholder showing how a weekly class card looks. Not a confirmed program.',
   'This is **sample content**. The masjid has not confirmed this program, its teacher, or its schedule.',
   'class', 'Weekly (sample)', 'Adults (sample)', 'published', true),
  ('sample-family-evening', 'Sample: family evening', 'نموذج: أمسية عائلية',
   'Placeholder for a family-oriented gathering card.',
   'Sample content only. Real family programming will be added by masjid staff.',
   'family', 'Monthly (sample)', 'Families (sample)', 'published', true),
  ('sample-new-muslim-basics', 'Sample: new Muslim basics', 'نموذج: أساسيات للمسلمين الجدد',
   'Placeholder for a gentle introductory series.',
   'Sample content only.', 'class', 'To be confirmed', 'Anyone curious (sample)', 'published', true);

insert into public.events (slug, title, title_ar, description_md, starts_at, ends_at, capacity, rsvp_enabled, waitlist_enabled, status, is_sample, program_id) values
  ('sample-open-house', 'Sample: community open house', 'نموذج: يوم مفتوح',
   'A **sample event** used to demonstrate RSVP, waitlist and calendar download. No real event has been scheduled.',
   date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '9 days 17 hours',
   date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '9 days 19 hours',
   3, true, true, 'published', true, null),
  ('sample-family-evening-session', 'Sample: family evening session', 'نموذج: جلسة أمسية عائلية',
   'Sample occurrence of the sample family program.',
   date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '16 days 18 hours 30 minutes',
   date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '16 days 20 hours',
   null, true, false, 'published', true, (select id from public.programs where slug = 'sample-family-evening'));

insert into public.volunteer_opportunities (title, title_ar, description_md, commitment, status, is_sample) values
  ('Sample: welcome desk helper', 'نموذج: مساعد الاستقبال',
   'Sample opportunity showing how a role would be described. Not a confirmed volunteer program.', 'A few hours a month (sample)', 'published', true),
  ('Sample: facility care team', 'نموذج: فريق العناية بالمرافق',
   'Sample opportunity. Real roles are defined by masjid leadership.', 'Flexible (sample)', 'published', true);

insert into public.public_faq (question, answer_md, category, language, status, is_sample, sort_order) values
  ('Sample: Can visitors who are not Muslim come to the masjid?',
   'Sample answer placeholder. The imam or masjid leadership will write the real answer for this page. Until then, please contact the masjid directly.',
   'visiting', 'en', 'published', true, 1),
  ('Sample: What should I wear when visiting?',
   'Sample answer placeholder awaiting imam approval. The welcome guide has general, widely shared etiquette; masjid-specific guidance will be confirmed by staff.',
   'visiting', 'en', 'published', true, 2),
  ('Sample: How do I ask the imam a private question?',
   'Create a free account, verify your email and use **Ask the Imam**. Only you and authorised imam staff can read your question.',
   'community', 'en', 'published', true, 3);
