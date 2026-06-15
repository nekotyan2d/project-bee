-- ============================================================================
--  Пасека — схема БД, v1 (PostgreSQL 14+)
--  Модель: семья (colony) — центральная сущность, улей — её "жильё",
--  события — неизменяемый журнал фактов (event-sourcing lite).
--  Таблицы device/reading созданы заранее под v2 (датчики) и в v1 не трогаются.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
--  Пользователи. Минимальная таблица — дешёвый задел на будущее распространение.
--  Для личного использования просто заводишь одну запись.
-- ---------------------------------------------------------------------------
create table users (
    id          uuid primary key default gen_random_uuid(),
    email       text unique not null,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Пасека (точка)
-- ---------------------------------------------------------------------------
create table apiary (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references users(id),
    name        text not null,
    latitude    double precision,
    longitude   double precision,
    notes       text,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Улей (физический короб). Может быть пустым, может менять "жильца".
-- ---------------------------------------------------------------------------
create table hive (
    id          uuid primary key default gen_random_uuid(),
    apiary_id   uuid not null references apiary(id) on delete cascade,
    label       text not null,                       -- "Улей №3"
    type        text,                                -- дадан / рута / лежак ...
    frame_count int,
    status      text not null default 'active',      -- active / stored / retired
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Семья (colony) — биологический объект. Отводится, объединяется, гибнет.
--  Семьи НЕ удаляются физически, а получают status (dead/merged/split),
--  чтобы сохранялась история событий.
--  Поля current_* — денормализованное текущее состояние, обновляется
--  приложением при записи соответствующих событий (быстрое чтение без
--  проигрывания всей ленты).
-- ---------------------------------------------------------------------------
create table colony (
    id                uuid primary key default gen_random_uuid(),
    apiary_id         uuid not null references apiary(id) on delete cascade,
    current_hive_id   uuid references hive(id) on delete set null,
    label             text not null,
    established_at    date,
    origin            text,                           -- swarm/split/package/bought
    status            text not null default 'active', -- active/dead/merged/split
    -- денормализованное текущее состояние:
    current_queen_id  uuid,                            -- FK добавляется ниже
    super_count       int  not null default 0,         -- текущее число магазинов
    last_inspected_at timestamptz,
    created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Матка — отдельный жизненный цикл и родословная.
-- ---------------------------------------------------------------------------
create table queen (
    id              uuid primary key default gen_random_uuid(),
    colony_id       uuid references colony(id) on delete set null,
    introduced_at   date,
    year            int,                              -- год вывода (метка по году)
    breed           text,                             -- карника / бакфаст / ...
    marked_color    text,                             -- цвет метки
    origin          text,                             -- bred/bought/emergency
    mother_queen_id uuid references queen(id),        -- родословная
    status          text not null default 'active',   -- active/replaced/dead
    created_at      timestamptz not null default now()
);

-- отложенный FK: текущая матка семьи
alter table colony
    add constraint colony_current_queen_fk
    foreign key (current_queen_id) references queen(id) on delete set null;

-- ---------------------------------------------------------------------------
--  СОБЫТИЯ — сердце системы. Append-only журнал фактов.
--  id генерируется КЛИЕНТОМ как UUIDv7 (сортируемый по времени) ещё до
--  отправки на сервер → офлайн-ввод работает, синхронизация идемпотентна
--  (upsert on conflict (id)).
--  Правки/удаления — через updated_at / soft-delete (deleted_at) для pull-синка.
--  Специфика типа лежит в payload (jsonb), валидируется на бэке по схеме типа.
-- ---------------------------------------------------------------------------
create table event (
    id          uuid primary key,                     -- UUIDv7 от клиента
    apiary_id   uuid not null references apiary(id) on delete cascade,
    colony_id   uuid references colony(id) on delete cascade,  -- null = событие пасеки
    type        text not null check (type in (
                    'inspection',     -- осмотр (уровень семьи)
                    'super_change',   -- постановка/снятие магазина (с датой)
                    'treatment',      -- лечение
                    'feeding',        -- подкормка
                    'queen_change',   -- замена матки
                    'harvest',        -- откачка / отбор продукции
                    'swarm',          -- роение
                    'migration',      -- кочёвка
                    'split',          -- отводок
                    'merge',          -- объединение
                    'death',          -- гибель семьи
                    'note'            -- произвольная заметка
                )),
    occurred_at timestamptz not null,                 -- КОГДА произошло (в поле)
    payload     jsonb not null default '{}',
    created_at  timestamptz not null default now(),   -- когда записано
    updated_at  timestamptz not null default now(),
    deleted_at  timestamptz                           -- soft-delete для синка
);

-- индексы под основные запросы (таймлайн семьи, лента пасеки, фильтр по типу,
-- инкрементальный pull-синк по updated_at)
create index event_colony_time_idx on event (colony_id, occurred_at desc);
create index event_apiary_time_idx on event (apiary_id, occurred_at desc);
create index event_type_idx        on event (type);
create index event_sync_idx        on event (apiary_id, updated_at);

-- ============================================================================
--  Примерные формы payload по типам (валидируются на бэке, напр. через TypeBox):
--
--  inspection   { queen_seen, eggs_seen, brood_pattern, frames_bees,
--                 frames_brood, stores_level, temperament,
--                 queen_cells: {type, count}, pests: [...], notes }
--  super_change { action: 'add'|'remove', count, kind: 'honey'|'brood' }
--  treatment    { product, active_ingredient, dose, target: 'varroa'|'nosema'|...,
--                 method, withdrawal_days }          -- срок ожидания перед откачкой
--  feeding      { feed: 'syrup'|'candy'|'pollen', amount, ratio }
--  queen_change { reason, source: 'bred'|'bought'|'emergency', new_queen_id }
--  harvest      { product: 'honey'|'wax'|'propolis', amount_kg, frames }
--  swarm        { kind: 'primary'|'secondary', captured: bool }
--  migration    { from, to }
--  split/merge  { source_colony_id / target_colony_id, ... }
--  death        { cause, suspected }
--  note         { text }
-- ============================================================================


-- ============================================================================
--  v2 — ДАТЧИКИ. Создано заранее, в v1 НЕ используется.
--  В v2: reading превратить в TimescaleDB hypertable.
-- ============================================================================
create table device (
    id          uuid primary key default gen_random_uuid(),
    hive_id     uuid references hive(id) on delete set null,
    kind        text not null,                        -- weight / temp / humidity
    external_id text,                                 -- ид железки (MAC ESP32)
    calibration jsonb,
    created_at  timestamptz not null default now()
);

create table reading (
    device_id   uuid not null references device(id) on delete cascade,
    ts          timestamptz not null,
    value       double precision not null
);
create index reading_device_ts_idx on reading (device_id, ts desc);
-- v2: select create_hypertable('reading', 'ts');
