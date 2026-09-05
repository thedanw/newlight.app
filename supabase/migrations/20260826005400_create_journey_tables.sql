CREATE TABLE journey_track_categories (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES journey_track_categories(id),
  name varchar NOT NULL,
  sort_order integer
);

CREATE TABLE journey_tracks (
  id uuid PRIMARY KEY,
  category_id uuid REFERENCES journey_track_categories(id),
  name varchar NOT NULL,
  sort_order integer,
  elvanto_location_id uuid UNIQUE,
  follow_elvanto boolean DEFAULT false,
  deleted_at timestamptz
);

CREATE TABLE journey_stages (
  slug varchar PRIMARY KEY,
  label varchar NOT NULL,
  color varchar(7),
  sort_order integer,
  is_terminal boolean DEFAULT false
);

CREATE TABLE people_audit (
  id uuid PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES people(id),
  field_changed varchar NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason audit_change_reason NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE people_categories (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  color varchar(7),
  _synced_at timestamptz NOT NULL DEFAULT now(),
  _source_modified timestamptz
);

CREATE TABLE custom_fields (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  type custom_field_type NOT NULL,
  _synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE custom_field_values (
  id uuid PRIMARY KEY,
  custom_field_id uuid NOT NULL REFERENCES custom_fields(id),
  name varchar NOT NULL
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_track_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_field_values TO authenticated;
-- service_role bypasses RLS but still needs table grants for the edge function
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_track_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_tracks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_audit TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fields TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_field_values TO service_role;
