create extension if not exists pgcrypto;

create type demographic as enum ('adult', 'youth', 'child');
create type gender as enum ('male', 'female');
create type marital_status as enum ('single', 'engaged', 'married', 'partner', 'widowed', 'divorced', 'separated');
create type access_permission as enum ('public', 'member_area', 'team_leaders', 'admin', 'super_admin');
create type relationship_type as enum ('primary_contact', 'spouse', 'partner', 'child', 'sibling', 'grandfather', 'grandmother', 'other', 'guardian', 'carer');
create type phone_type as enum ('home', 'mobile', 'work', 'other');
create type address_kind as enum ('home', 'postal');
create type yes_no as enum ('yes', 'no');
create type tag_category as enum ('location', 'journey_track', 'demographic', 'status', 'custom');
create type audit_change_reason as enum ('manual', 'auto_progression', 'gdpr_request', 'migration', 'sync');
create type safe_ministry_leader_type as enum ('adults_leader', 'junior_leader', 'not_active', 'under_13_assistant', 'visiting_leader');
create type smt_type as enum ('essentials', 'junior', 'refresher');
create type smc_result as enum ('age_13_17_approved', 'over_18_approved');

create type person_status as enum ('active', 'suspended');
create type family_relationship as enum ('primary_contact', 'spouse', 'partner', 'child', 'sibling', 'grandfather', 'grandmother', 'other');
create type group_status as enum ('active', 'suspended');
create type flow_step_member_status as enum ('complete', 'notstarted', 'pending', 'inprogress');
create type event_status as enum ('public', 'private', 'draft');
create type event_repeat as enum ('daily', 'weekdays', 'mon_wed_fri', 'tue_thu', 'weekly', 'fortnightly', 'monthly', 'yearly');
create type custom_field_type as enum ('text', 'select_multi');
