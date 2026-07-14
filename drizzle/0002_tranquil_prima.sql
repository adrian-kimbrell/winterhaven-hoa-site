CREATE TABLE "thread" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"hidden_by_id" text,
	"hidden_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_reply_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_hidden_by_id_user_id_fk" FOREIGN KEY ("hidden_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;