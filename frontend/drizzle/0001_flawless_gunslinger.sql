CREATE TABLE "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"heart_rate" integer,
	"bp_systolic" integer,
	"bp_diastolic" integer,
	"temperature_f" numeric(5, 1),
	"oxygen_saturation" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "number" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "reason" varchar(255);--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "room_type" varchar(20) DEFAULT 'patient' NOT NULL;--> statement-breakpoint
ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;