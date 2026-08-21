-- Optional seed: one realistic week relative to 2026-08-17 (Mon).
-- Adjust dates if needed after running.

insert into public.schedule_entries (
  date, employer, work_mode, location,
  start_time, end_time, expected_home_time,
  household_note, source, source_reference,
  priority, is_all_day, manual_override
) values
  (
    '2026-08-17', 'Post Office', 'WFH', null,
    '08:30', '17:00', '17:30',
    null, 'manual', null,
    0, false, false
  ),
  (
    '2026-08-18', 'Wagamama', 'WFH', null,
    '05:00', '08:00', '08:15',
    'Early migration window', 'chatgpt', 'wagamama-early-2026-08-18',
    1, false, false
  ),
  (
    '2026-08-18', 'Post Office', 'WFH', null,
    '09:00', '17:00', '17:15',
    null, 'manual', null,
    0, false, false
  ),
  (
    '2026-08-19', 'CPM Tech', 'On site', 'Birmingham',
    '07:30', '16:30', '18:00',
    null, 'outlook', 'cpm-onsite-2026-08-19',
    0, false, false
  ),
  (
    '2026-08-20', 'Off', 'Off', null,
    null, null, null,
    'At home', 'manual', null,
    0, true, false
  ),
  (
    '2026-08-21', 'Post Office', 'WFH', null,
    '08:30', '17:00', '17:30',
    null, 'manual', null,
    0, false, false
  ),
  (
    '2026-08-22', 'Personal / Family', 'Off', null,
    null, null, null,
    null, 'manual', null,
    0, true, false
  );
-- Sunday left empty on purpose
