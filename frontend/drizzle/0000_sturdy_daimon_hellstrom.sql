CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"room_id" uuid,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" text NOT NULL,
	"preferred_channel" varchar(10) DEFAULT 'sms' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nurse_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nurse_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"current_room_id" uuid,
	"current_patient_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nurses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(50) DEFAULT 'nurse' NOT NULL,
	"phone" text,
	"email" text,
	"floor_assignment" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid,
	"name" varchar(100) NOT NULL,
	"acuity_level" integer DEFAULT 1 NOT NULL,
	"admitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"family_phone" text
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'vacant' NOT NULL,
	"last_rounded_at" timestamp with time zone,
	"last_sanitized_at" timestamp with time zone,
	"camera_feed_url" text
);
--> statement-breakpoint
CREATE TABLE "rounding_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"nurse_id" uuid,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sanitized" boolean DEFAULT false NOT NULL,
	"duration_sec" integer
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nurse_id" uuid,
	"date" date NOT NULL,
	"time_slot" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_contacts" ADD CONSTRAINT "family_contacts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurse_statuses" ADD CONSTRAINT "nurse_statuses_nurse_id_nurses_id_fk" FOREIGN KEY ("nurse_id") REFERENCES "public"."nurses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurse_statuses" ADD CONSTRAINT "nurse_statuses_current_room_id_rooms_id_fk" FOREIGN KEY ("current_room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurse_statuses" ADD CONSTRAINT "nurse_statuses_current_patient_id_patients_id_fk" FOREIGN KEY ("current_patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounding_logs" ADD CONSTRAINT "rounding_logs_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounding_logs" ADD CONSTRAINT "rounding_logs_nurse_id_nurses_id_fk" FOREIGN KEY ("nurse_id") REFERENCES "public"."nurses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_nurse_id_nurses_id_fk" FOREIGN KEY ("nurse_id") REFERENCES "public"."nurses"("id") ON DELETE no action ON UPDATE no action;