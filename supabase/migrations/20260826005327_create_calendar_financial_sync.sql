CREATE TABLE calendars (
	id uuid PRIMARY KEY,
	name varchar NOT NULL,
	color varchar(7),
	members boolean,
	published boolean,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE calendar_events (
	id uuid PRIMARY KEY,
	calendar_id uuid REFERENCES calendars(id),
	name varchar NOT NULL,
	status event_status NOT NULL DEFAULT 'public',
	start_date timestamptz NOT NULL,
	end_date timestamptz NOT NULL,
	all_day boolean DEFAULT false,
	where_label varchar,
	description text,
	admin_notes text,
	url text,
	color varchar(7),
	picture_url text,
	interval_summary varchar,
	organizer_person_id uuid REFERENCES people(id),
	register_url text,
	register_form_id varchar,
	who_can_attend varchar,
	show_guest_list boolean DEFAULT false,
	repeat event_repeat,
	repeat_frequency integer,
	repeat_on varchar,
	repeat_occurrences integer,
	repeat_end_date timestamptz,
	assets jsonb,
	_synced_at timestamptz NOT NULL,
	_source_modified timestamptz
);

CREATE INDEX calendar_events_calendar_id_idx ON calendar_events (calendar_id);
CREATE INDEX calendar_events_dates_idx ON calendar_events (start_date, end_date);

CREATE TABLE calendar_event_locations (
	event_id uuid REFERENCES calendar_events(id),
	location_id uuid REFERENCES locations(id),
	PRIMARY KEY (event_id, location_id)
);

CREATE TABLE sync_errors (
	id uuid PRIMARY KEY,
	entity varchar NOT NULL,
	elvanto_id uuid,
	endpoint varchar NOT NULL,
	error_code varchar NOT NULL,
	error_message text,
	request_payload jsonb,
	attempt_count integer NOT NULL DEFAULT 1,
	next_retry_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	resolved_at timestamptz
);

CREATE TABLE sync_watermarks (
	entity varchar PRIMARY KEY,
	last_full_sync_at timestamptz,
	last_poll_at timestamptz,
	total_synced integer DEFAULT 0,
	notes text
);

CREATE TABLE sync_conflicts (
	id uuid PRIMARY KEY,
	entity varchar NOT NULL,
	elvanto_id uuid NOT NULL,
	field varchar NOT NULL,
	app_value jsonb,
	elvanto_value jsonb,
	resolution varchar,
	resolved_by uuid,
	resolved_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now()
);
