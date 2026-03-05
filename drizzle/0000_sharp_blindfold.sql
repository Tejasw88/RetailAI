-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "products" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"barcode" varchar(50),
	"brand" varchar(100),
	"emoji" varchar(10),
	"mrp" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(10),
	"current_stock" integer DEFAULT 0 NOT NULL,
	"safety_stock" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"eoq" integer DEFAULT 0 NOT NULL,
	"lead_time_days" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(10),
	"sale_date" date NOT NULL,
	"units_sold" integer NOT NULL,
	"revenue" numeric(10, 2) NOT NULL,
	CONSTRAINT "sales_history_product_id_sale_date_key" UNIQUE("product_id","sale_date")
);
--> statement-breakpoint
CREATE TABLE "forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(10),
	"forecast_date" date NOT NULL,
	"predicted_units" integer NOT NULL,
	"lower_bound" integer NOT NULL,
	"upper_bound" integer NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "forecasts_product_id_forecast_date_key" UNIQUE("product_id","forecast_date")
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(10),
	"status" varchar(20) NOT NULL,
	"potential_savings" numeric(10, 2) DEFAULT '0',
	"recommended_order" integer DEFAULT 0,
	"message" text,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "alerts_status_check" CHECK ((status)::text = ANY ((ARRAY['CRITICAL'::character varying, 'LOW'::character varying, 'OVERSTOCK'::character varying, 'OPTIMAL'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
*/