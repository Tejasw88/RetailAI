import { relations } from "drizzle-orm/relations";
import { products, inventory, salesHistory, forecasts, alerts } from "./schema";

export const inventoryRelations = relations(inventory, ({one}) => ({
	product: one(products, {
		fields: [inventory.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	inventories: many(inventory),
	salesHistories: many(salesHistory),
	forecasts: many(forecasts),
	alerts: many(alerts),
}));

export const salesHistoryRelations = relations(salesHistory, ({one}) => ({
	product: one(products, {
		fields: [salesHistory.productId],
		references: [products.id]
	}),
}));

export const forecastsRelations = relations(forecasts, ({one}) => ({
	product: one(products, {
		fields: [forecasts.productId],
		references: [products.id]
	}),
}));

export const alertsRelations = relations(alerts, ({one}) => ({
	product: one(products, {
		fields: [alerts.productId],
		references: [products.id]
	}),
}));