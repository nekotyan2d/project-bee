CREATE TABLE "apiary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "colony" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apiary_id" uuid NOT NULL,
	"current_hive_id" uuid,
	"label" text NOT NULL,
	"established_at" date,
	"origin" text,
	"status" text DEFAULT 'active' NOT NULL,
	"current_queen_id" uuid,
	"super_count" integer DEFAULT 0 NOT NULL,
	"last_inspected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hive_id" uuid,
	"kind" text NOT NULL,
	"external_id" text,
	"calibration" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"apiary_id" uuid NOT NULL,
	"colony_id" uuid,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "event_type_check" CHECK (type in ('inspection', 'super_change', 'treatment', 'feeding', 'queen_change', 'harvest', 'swarm', 'migration', 'split', 'merge', 'death', 'note'))
);
--> statement-breakpoint
CREATE TABLE "hive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apiary_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" text,
	"frame_count" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "queen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"colony_id" uuid,
	"introduced_at" date,
	"year" integer,
	"breed" text,
	"marked_color" text,
	"origin" text,
	"mother_queen_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reading" (
	"device_id" uuid NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"value" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "apiary" ADD CONSTRAINT "apiary_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colony" ADD CONSTRAINT "colony_apiary_id_apiary_id_fk" FOREIGN KEY ("apiary_id") REFERENCES "public"."apiary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colony" ADD CONSTRAINT "colony_current_hive_id_hive_id_fk" FOREIGN KEY ("current_hive_id") REFERENCES "public"."hive"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colony" ADD CONSTRAINT "colony_current_queen_id_queen_id_fk" FOREIGN KEY ("current_queen_id") REFERENCES "public"."queen"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_hive_id_hive_id_fk" FOREIGN KEY ("hive_id") REFERENCES "public"."hive"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_apiary_id_apiary_id_fk" FOREIGN KEY ("apiary_id") REFERENCES "public"."apiary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_colony_id_colony_id_fk" FOREIGN KEY ("colony_id") REFERENCES "public"."colony"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hive" ADD CONSTRAINT "hive_apiary_id_apiary_id_fk" FOREIGN KEY ("apiary_id") REFERENCES "public"."apiary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queen" ADD CONSTRAINT "queen_colony_id_colony_id_fk" FOREIGN KEY ("colony_id") REFERENCES "public"."colony"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queen" ADD CONSTRAINT "queen_mother_queen_id_queen_id_fk" FOREIGN KEY ("mother_queen_id") REFERENCES "public"."queen"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading" ADD CONSTRAINT "reading_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_colony_time_idx" ON "event" USING btree ("colony_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "event_apiary_time_idx" ON "event" USING btree ("apiary_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "event_type_idx" ON "event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "event_sync_idx" ON "event" USING btree ("apiary_id","updated_at");--> statement-breakpoint
CREATE INDEX "reading_device_ts_idx" ON "reading" USING btree ("device_id","ts" DESC NULLS LAST);