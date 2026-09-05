CREATE TABLE locations (
	id uuid PRIMARY KEY,
	name varchar NOT NULL
);

CREATE TABLE groups (
	id uuid PRIMARY KEY,
	date_added timestamptz,
	date_modified timestamptz NOT NULL,
	name varchar NOT NULL,
	status group_status NOT NULL DEFAULT 'active',
	description text,
	logo_url text,
	picture_url text,
	meeting_address varchar,
	meeting_city varchar,
	meeting_state varchar,
	meeting_postcode varchar,
	meeting_country varchar,
	meeting_start_date date,
	meeting_end_date date,
	meeting_start_time time,
	meeting_end_time time,
	meeting_day varchar,
	meeting_time varchar,
	meeting_frequency jsonb,
	_synced_at timestamptz NOT NULL,
	_source_modified timestamptz NOT NULL
);

CREATE TABLE group_members (
	group_id uuid REFERENCES groups(id),
	person_id uuid REFERENCES people(id),
	position varchar,
	_synced_at timestamptz NOT NULL,
	PRIMARY KEY (group_id, person_id)
);

CREATE TABLE people_flows (
	id uuid PRIMARY KEY,
	name varchar NOT NULL,
	status varchar,
	access varchar,
	admins uuid[],
	locations jsonb,
	demographics jsonb,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE people_flow_steps (
	id uuid PRIMARY KEY,
	flow_id uuid REFERENCES people_flows(id),
	parent_step_id uuid REFERENCES people_flow_steps(id),
	priority integer,
	name varchar NOT NULL,
	description text,
	instructions text,
	notifications boolean DEFAULT false,
	entry_point varchar,
	step_due jsonb,
	admins jsonb,
	_synced_at timestamptz NOT NULL
);

CREATE TABLE people_flow_step_members (
	id uuid PRIMARY KEY,
	step_id uuid REFERENCES people_flow_steps(id),
	person_id uuid REFERENCES people(id),
	date_added timestamptz,
	assigned_admin_id uuid REFERENCES people(id),
	status flow_step_member_status NOT NULL,
	completed_date timestamptz,
	due_date date,
	_synced_at timestamptz NOT NULL
);
