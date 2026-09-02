create table if not exists learners (id text primary key, class_number integer not null check(class_number between 1 and 10), created_at timestamptz not null default now());
create table if not exists learning_events (event_id text primary key, learner_id text not null, event_type text not null, occurred_at timestamptz not null, payload jsonb not null);
create table if not exists content_versions (content_id text not null, version integer not null, status text not null, provenance jsonb not null, primary key(content_id,version));
create table if not exists reward_ledger (event_id text primary key, learner_id text not null, coins integer not null, xp integer not null, verification_state text not null);
create table if not exists audit_log (id bigserial primary key, actor_role text not null, action text not null, entity_id text, occurred_at timestamptz not null default now(), metadata jsonb not null default '{}');
