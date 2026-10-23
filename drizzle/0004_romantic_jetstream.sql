CREATE TABLE "board_member" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"email" text,
	"phone" text,
	"bio" text,
	"photo_key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_post" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'update' NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"meeting_date" text,
	"document_key" text,
	"document_name" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ccr_question" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"short_answer" text,
	"answer" text DEFAULT '' NOT NULL,
	"section_ref" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lighter_post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"note" text,
	"image_key" text,
	"image_alt" text,
	"allow_comments" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_story" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"kicker" text,
	"summary" text,
	"body" text DEFAULT '' NOT NULL,
	"image_key" text,
	"image_alt" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_post" ADD CONSTRAINT "board_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ccr_question" ADD CONSTRAINT "ccr_question_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lighter_post" ADD CONSTRAINT "lighter_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_story" ADD CONSTRAINT "news_story_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;