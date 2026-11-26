ALTER TABLE "categories" ADD COLUMN "name_bn" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description_bn" text;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD COLUMN "name_bn" text;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD COLUMN "eta_text_bn" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_name_bn" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "name_bn" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description_bn" text;