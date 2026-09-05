CREATE TABLE service_types (
	id uuid PRIMARY KEY,
	name varchar NOT NULL
);

CREATE TABLE services (
	id uuid PRIMARY KEY,
	status integer,
	date_added timestamptz,
	date_modified timestamptz NOT NULL,
	name varchar NOT NULL,
	series_name varchar,
	date timestamptz,
	description text,
	service_type_id uuid REFERENCES service_types(id),
	location_id uuid REFERENCES locations(id),
	_synced_at timestamptz NOT NULL,
	_source_modified timestamptz NOT NULL
);

CREATE TABLE songs (
	id uuid PRIMARY KEY,
	status integer NOT NULL DEFAULT 0,
	date_added timestamptz,
	date_modified timestamptz NOT NULL,
	title varchar NOT NULL,
	permalink varchar,
	ccli_number varchar,
	is_item boolean DEFAULT false,
	learn boolean DEFAULT false,
	allow_downloads boolean DEFAULT false,
	artist varchar,
	album varchar,
	notes text,
	_synced_at timestamptz NOT NULL,
	_source_modified timestamptz NOT NULL
);

CREATE TABLE service_times (
	id uuid PRIMARY KEY,
	service_id uuid NOT NULL REFERENCES services(id),
	name varchar,
	starts timestamptz NOT NULL,
	ends timestamptz,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE service_plan_items (
	id uuid PRIMARY KEY,
	service_time_id uuid NOT NULL REFERENCES service_times(id),
	heading boolean DEFAULT false,
	duration interval,
	when_label varchar,
	title varchar,
	description text,
	song_id uuid REFERENCES songs(id),
	sort_order integer,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE service_volunteers (
	position_id uuid,
	service_time_id uuid REFERENCES service_times(id),
	department_id uuid,
	department_name varchar,
	sub_department_id uuid,
	sub_department_name varchar,
	position_name varchar,
	person_id uuid REFERENCES people(id),
	volunteer_status varchar,
	_synced_at timestamptz NOT NULL,
	UNIQUE (service_time_id, position_id, person_id)
);

CREATE TABLE service_files (
	id uuid PRIMARY KEY,
	service_id uuid NOT NULL REFERENCES services(id),
	title varchar,
	content_url text,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE service_notes (
	id uuid PRIMARY KEY,
	service_id uuid NOT NULL REFERENCES services(id),
	note text,
	date_added timestamptz,
	date_modified timestamptz,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE song_categories (
	id uuid PRIMARY KEY,
	name varchar NOT NULL
);

CREATE TABLE song_category_memberships (
	song_id uuid REFERENCES songs(id),
	song_category_id uuid REFERENCES song_categories(id),
	PRIMARY KEY (song_id, song_category_id)
);

CREATE TABLE arrangements (
	id uuid PRIMARY KEY,
	song_id uuid NOT NULL REFERENCES songs(id),
	date_added timestamptz,
	date_modified timestamptz,
	name varchar NOT NULL,
	copyright varchar,
	sequence jsonb,
	minutes numeric(3),
	seconds numeric(2),
	bpm numeric(4,1),
	key_male varchar,
	key_female varchar,
	lyrics text,
	chord_chart_key varchar,
	chord_chart text,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE song_keys (
	id uuid PRIMARY KEY,
	arrangement_id uuid NOT NULL REFERENCES arrangements(id),
	date_added timestamptz,
	date_modified timestamptz,
	name varchar NOT NULL,
	key_starting varchar NOT NULL,
	key_ending varchar,
	keys_alternate jsonb,
	_synced_at timestamptz NOT NULL
);
