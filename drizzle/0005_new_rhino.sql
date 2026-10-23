ALTER TABLE "comment" DROP CONSTRAINT "comment_hidden_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "thread" DROP CONSTRAINT "thread_hidden_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_hidden_by_id_user_id_fk" FOREIGN KEY ("hidden_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_hidden_by_id_user_id_fk" FOREIGN KEY ("hidden_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;