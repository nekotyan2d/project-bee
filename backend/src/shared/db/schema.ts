import { sql } from "drizzle-orm";
import {
    type AnyPgColumn,
    check,
    date,
    doublePrecision,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const EVENT_TYPES = [
    "inspection",
    "super_change",
    "treatment",
    "feeding",
    "queen_change",
    "harvest",
    "swarm",
    "migration",
    "split",
    "merge",
    "death",
    "note",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiary = pgTable("apiary", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => users.id),
    name: text("name").notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const hive = pgTable("hive", {
    id: uuid("id").defaultRandom().primaryKey(),
    apiaryId: uuid("apiary_id")
        .notNull()
        .references(() => apiary.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    type: text("type"),
    frameCount: integer("frame_count"),
    status: text("status").notNull().default("active"),
    x: integer("x"),
    y: integer("y"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const colony = pgTable("colony", {
    id: uuid("id").defaultRandom().primaryKey(),
    apiaryId: uuid("apiary_id")
        .notNull()
        .references(() => apiary.id, { onDelete: "cascade" }),
    currentHiveId: uuid("current_hive_id").references(() => hive.id, { onDelete: "set null" }),
    label: text("label").notNull(),
    establishedAt: date("established_at"),
    origin: text("origin"),
    status: text("status").notNull().default("active"),
    currentQueenId: uuid("current_queen_id").references((): AnyPgColumn => queen.id, {
        onDelete: "set null",
    }),
    superCount: integer("super_count").notNull().default(0),
    lastInspectedAt: timestamp("last_inspected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const queen = pgTable("queen", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => users.id),
    colonyId: uuid("colony_id").references(() => colony.id, { onDelete: "set null" }),
    introducedAt: date("introduced_at"),
    year: integer("year"),
    breed: text("breed"),
    origin: text("origin"),
    motherQueenId: uuid("mother_queen_id").references((): AnyPgColumn => queen.id),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const event = pgTable(
    "event",
    {
        id: uuid("id").primaryKey(),
        apiaryId: uuid("apiary_id")
            .notNull()
            .references(() => apiary.id, { onDelete: "cascade" }),
        colonyId: uuid("colony_id").references(() => colony.id, { onDelete: "cascade" }),
        type: text("type", { enum: EVENT_TYPES }).notNull(),
        occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
        payload: jsonb("payload").notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
        check("event_type_check", sql.raw(`type in (${EVENT_TYPES.map((v) => `'${v}'`).join(", ")})`)),
        index("event_colony_time_idx").on(t.colonyId, t.occurredAt.desc()),
        index("event_apiary_time_idx").on(t.apiaryId, t.occurredAt.desc()),
        index("event_type_idx").on(t.type),
        index("event_sync_idx").on(t.apiaryId, t.updatedAt),
    ],
);

export const device = pgTable("device", {
    id: uuid("id").defaultRandom().primaryKey(),
    hiveId: uuid("hive_id").references(() => hive.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    externalId: text("external_id"),
    calibration: jsonb("calibration"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reading = pgTable(
    "reading",
    {
        deviceId: uuid("device_id")
            .notNull()
            .references(() => device.id, { onDelete: "cascade" }),
        ts: timestamp("ts", { withTimezone: true }).notNull(),
        value: doublePrecision("value").notNull(),
    },
    (t) => [index("reading_device_ts_idx").on(t.deviceId, t.ts.desc())],
);
