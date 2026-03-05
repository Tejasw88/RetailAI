import { pgTable, varchar, numeric, timestamp, foreignKey, serial, integer, unique, date, check, text, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const products = pgTable("products", {
	id: varchar({ length: 10 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	unitCost: numeric("unit_cost", { precision: 10, scale:  2 }).notNull(),
	sellingPrice: numeric("selling_price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	barcode: varchar({ length: 50 }),
	brand: varchar({ length: 100 }),
	emoji: varchar({ length: 10 }),
	mrp: numeric({ precision: 10, scale:  2 }),
});

export const inventory = pgTable("inventory", {
	id: serial().primaryKey().notNull(),
	productId: varchar("product_id", { length: 10 }),
	currentStock: integer("current_stock").default(0).notNull(),
	safetyStock: integer("safety_stock").default(0).notNull(),
	reorderPoint: integer("reorder_point").default(0).notNull(),
	eoq: integer().default(0).notNull(),
	leadTimeDays: integer("lead_time_days").default(5).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "inventory_product_id_fkey"
		}),
]);

export const salesHistory = pgTable("sales_history", {
	id: serial().primaryKey().notNull(),
	productId: varchar("product_id", { length: 10 }),
	saleDate: date("sale_date").notNull(),
	unitsSold: integer("units_sold").notNull(),
	revenue: numeric({ precision: 10, scale:  2 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "sales_history_product_id_fkey"
		}),
	unique("sales_history_product_id_sale_date_key").on(table.productId, table.saleDate),
]);

export const forecasts = pgTable("forecasts", {
	id: serial().primaryKey().notNull(),
	productId: varchar("product_id", { length: 10 }),
	forecastDate: date("forecast_date").notNull(),
	predictedUnits: integer("predicted_units").notNull(),
	lowerBound: integer("lower_bound").notNull(),
	upperBound: integer("upper_bound").notNull(),
	generatedAt: timestamp("generated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "forecasts_product_id_fkey"
		}),
	unique("forecasts_product_id_forecast_date_key").on(table.productId, table.forecastDate),
]);

export const alerts = pgTable("alerts", {
	id: serial().primaryKey().notNull(),
	productId: varchar("product_id", { length: 10 }),
	status: varchar({ length: 20 }).notNull(),
	potentialSavings: numeric("potential_savings", { precision: 10, scale:  2 }).default('0'),
	recommendedOrder: integer("recommended_order").default(0),
	message: text(),
	resolved: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "alerts_product_id_fkey"
		}),
	check("alerts_status_check", sql`(status)::text = ANY ((ARRAY['CRITICAL'::character varying, 'LOW'::character varying, 'OVERSTOCK'::character varying, 'OPTIMAL'::character varying])::text[])`),
]);
