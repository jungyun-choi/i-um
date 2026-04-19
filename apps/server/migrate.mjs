import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: '2406:da18:243:7428:696b:35eb:b54c:a415',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'wuKhif-siztas-0giqny',
  ssl: { rejectUnauthorized: false },
});

await client.connect();

await client.query(`create extension if not exists "uuid-ossp"`);

await client.query(`
create table if not exists children (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  birth_date date not null,
  gender     text check (gender in ('M', 'F', 'N')),
  avatar_url text,
  created_at timestamptz default now()
)`);
console.log('✅ children');

await client.query(`create index if not exists children_user_id_idx on children(user_id)`);

await client.query(`
create table if not exists photos (
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
)`);
console.log('✅ photos');

await client.query(`create index if not exists photos_child_taken_idx on photos(child_id, taken_at desc)`);

await client.query(`
create table if not exists diary_entries (
  id         uuid primary key default uuid_generate_v4(),
  photo_id   uuid not null references photos(id) on delete cascade,
  child_id   uuid not null references children(id) on delete cascade,
  content    text,
  is_edited  boolean default false,
  milestone  text,
  status     text default 'pending' check (status in ('pending','generating','done','failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)`);
console.log('✅ diary_entries');

await client.query(`create index if not exists diary_child_idx on diary_entries(child_id, created_at desc)`);
await client.query(`create index if not exists diary_photo_idx on diary_entries(photo_id)`);

await client.query(`
create table if not exists milestones (
  id         uuid primary key default uuid_generate_v4(),
  child_id   uuid not null references children(id) on delete cascade,
  type       text not null,
  date       date not null,
  photo_id   uuid references photos(id),
  diary_id   uuid references diary_entries(id),
  created_at timestamptz default now(),
  unique(child_id, type)
)`);
console.log('✅ milestones');

await client.query(`alter table children enable row level security`);
await client.query(`alter table photos enable row level security`);
await client.query(`alter table diary_entries enable row level security`);
await client.query(`alter table milestones enable row level security`);

const policies = [
  [`do $$ begin if not exists (select 1 from pg_policies where tablename='children' and policyname='users_own_children') then create policy "users_own_children" on children for all using (auth.uid() = user_id); end if; end $$`],
  [`do $$ begin if not exists (select 1 from pg_policies where tablename='photos' and policyname='users_own_photos') then create policy "users_own_photos" on photos for all using (auth.uid() = user_id); end if; end $$`],
  [`do $$ begin if not exists (select 1 from pg_policies where tablename='diary_entries' and policyname='users_own_diary') then create policy "users_own_diary" on diary_entries for all using (child_id in (select id from children where user_id = auth.uid())); end if; end $$`],
  [`do $$ begin if not exists (select 1 from pg_policies where tablename='milestones' and policyname='users_own_milestones') then create policy "users_own_milestones" on milestones for all using (child_id in (select id from children where user_id = auth.uid())); end if; end $$`],
];

for (const [sql] of policies) await client.query(sql);
console.log('✅ RLS policies');

await client.end();
console.log('\n🎉 마이그레이션 완료!');
