-- Run this once in Supabase: SQL Editor > New query > Run
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  tech text[] not null default '{}',
  live_url text not null default '',
  github_url text not null default '',
  created_at timestamptz not null default now()
);

-- Lock the table: only the server (service key) can read or write it.
alter table public.projects enable row level security;

-- Starter projects (edit the links later, or delete them from the site with #admin)
insert into public.projects (name, description, tech, github_url, created_at) values
 ('Saptapadi','Online Hindu wedding app that walks through the ceremony step by step.','{JavaScript,HTML,CSS}','https://github.com/ansh385', now() - interval '6 min'),
 ('Bean & Byte Café','Full-stack café ordering platform with a menu, cart and orders.','{React,Node.js,MongoDB}','https://github.com/ansh385', now() - interval '5 min'),
 ('AI Study Planner','Full-stack planner with an adaptive scoring engine that adjusts your study schedule.','{React,Node.js,AI}','https://github.com/ansh385', now() - interval '4 min'),
 ('Chaos World','Gamified amusement park app built with React.','{React,CSS}','https://github.com/ansh385', now() - interval '3 min'),
 ('Monthly Ledger','A React to-do app organised by month.','{React}','https://github.com/ansh385', now() - interval '2 min'),
 ('Retro CRT Terminal Portfolio','Portfolio styled as a retro CRT terminal.','{Next.js,Supabase}','https://github.com/ansh385', now() - interval '1 min'),
 ('HOLomat','Local-first, self-hosted parametric CAD platform with AI assistance.','{AI,"Open source"}','https://github.com/ansh385', now());
