-- 이음(i-um) MVP DB 스키마
-- Supabase SQL Editor에서 실행

create extension if not exists "uuid-ossp";

create table children (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  birth_date date not null,
  gender     text check (gender in ('M', 'F', 'N')),
  avatar_url text,
  created_at timestamptz default now()
);
create index on children(user_id);

create table photos (
  id            uuid primary key default uuid_generate_v4(),
  child_id      uuid not null references children(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  s3_key        text not null,
  taken_at      timestamptz not null,
  gps_lat       float,
  gps_lng       float,
  location_name text,
  ai_analysis   jsonb,
  created_at    timestamptz default now()
);
create index on photos(child_id, taken_at desc);

create table diary_entries (
  id         uuid primary key default uuid_generate_v4(),
  photo_id   uuid not null references photos(id) on delete cascade,
  child_id   uuid not null references children(id) on delete cascade,
  content    text,
  is_edited  boolean default false,
  milestone  text,
  status     text default 'pending' check (status in ('pending','generating','done','failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on diary_entries(child_id, created_at desc);
create index on diary_entries(photo_id);

create table milestones (
  id         uuid primary key default uuid_generate_v4(),
  child_id   uuid not null references children(id) on delete cascade,
  type       text not null,
  date       date not null,
  photo_id   uuid references photos(id),
  diary_id   uuid references diary_entries(id),
  created_at timestamptz default now(),
  unique(child_id, type)
);

-- RLS 활성화
alter table children enable row level security;
alter table photos enable row level security;
alter table diary_entries enable row level security;
alter table milestones enable row level security;

-- RLS 정책 (자기 데이터만 접근)
create policy "users_own_children" on children
  for all using (auth.uid() = user_id);

create policy "users_own_photos" on photos
  for all using (auth.uid() = user_id);

create policy "users_own_diary" on diary_entries
  for all using (
    child_id in (select id from children where user_id = auth.uid())
  );

create policy "users_own_milestones" on milestones
  for all using (
    child_id in (select id from children where user_id = auth.uid())
  );
