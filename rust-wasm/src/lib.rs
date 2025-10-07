use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct TradeOpportunity {
    pub item_id: String,
    pub item_name: String,
    pub buy_city: String,
    pub sell_city: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub quantity: u32,
    pub profit: f64,
    pub roi: f64,
    pub taxes: f64,
    pub transport_cost: f64,
}

#[derive(Serialize, Deserialize)]
pub struct MarketData {
    pub item_id: String,
    pub item_name: String,
    pub city: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub quantity: u32,
}

#[wasm_bindgen]
pub struct TradeScanner {
    market_tax: f64,
    setup_fee: f64,
}

#[wasm_bindgen]
impl TradeScanner {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TradeScanner {
        TradeScanner {
            market_tax: 0.045,  // 4.5%
            setup_fee: 0.015,   // 1.5%
        }
    }

    /// Scan for arbitrage opportunities across all cities
    /// Returns top N opportunities sorted by ROI
    #[wasm_bindgen]
    pub fn scan_opportunities(
        &self,
        market_data_js: JsValue,
        min_roi: f64,
        max_results: usize,
    ) -> Result<JsValue, JsValue> {
        let market_data: Vec<MarketData> = serde_wasm_bindgen::from_value(market_data_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse market data: {}", e)))?;

        let mut opportunities = Vec::new();

        // Group by item_id for cross-city comparison
        let mut items_by_id: std::collections::HashMap<String, Vec<&MarketData>> =
            std::collections::HashMap::new();

        for data in &market_data {
            items_by_id
                .entry(data.item_id.clone())
                .or_insert_with(Vec::new)
                .push(data);
        }

        // Find arbitrage opportunities
        for (item_id, cities) in items_by_id.iter() {
            for buy_city_data in cities.iter() {
                for sell_city_data in cities.iter() {
                    if buy_city_data.city == sell_city_data.city {
                        continue;
                    }

                    let buy_price = buy_city_data.buy_price;
                    let sell_price = sell_city_data.sell_price;

                    if buy_price <= 0.0 || sell_price <= 0.0 {
                        continue;
                    }

                    let quantity = buy_city_data.quantity.min(sell_city_data.quantity);
                    if quantity == 0 {
                        continue;
                    }

                    let opportunity = self.calculate_opportunity(
                        item_id.clone(),
                        buy_city_data.item_name.clone(),
                        buy_city_data.city.clone(),
                        sell_city_data.city.clone(),
                        buy_price,
                        sell_price,
                        quantity,
                    );

                    if opportunity.roi >= min_roi {
                        opportunities.push(opportunity);
                    }
                }
            }
        }

        // Sort by ROI descending
        opportunities.sort_by(|a, b| b.roi.partial_cmp(&a.roi).unwrap());

        // Take top N results
        opportunities.truncate(max_results);

        serde_wasm_bindgen::to_value(&opportunities)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize results: {}", e)))
    }

    fn calculate_opportunity(
        &self,
        item_id: String,
        item_name: String,
        buy_city: String,
        sell_city: String,
        buy_price: f64,
        sell_price: f64,
        quantity: u32,
    ) -> TradeOpportunity {
        let qty = quantity as f64;

        // Calculate costs
        let buy_total = buy_price * qty;
        let buy_taxes = buy_total * (self.market_tax + self.setup_fee);

        // Estimate transport cost (simplified - 100 silver per zone)
        let transport_cost = self.estimate_transport_cost(&buy_city, &sell_city, qty);

        let total_cost = buy_total + buy_taxes + transport_cost;

        // Calculate revenue
        let sell_total = sell_price * qty;
        let sell_taxes = sell_total * (self.market_tax + self.setup_fee);
        let net_revenue = sell_total - sell_taxes;

        // Calculate profit and ROI
        let profit = net_revenue - total_cost;
        let roi = if total_cost > 0.0 {
            (profit / total_cost) * 100.0
        } else {
            0.0
        };

        TradeOpportunity {
            item_id,
            item_name,
            buy_city,
            sell_city,
            buy_price,
            sell_price,
            quantity,
            profit,
            roi,
            taxes: buy_taxes + sell_taxes,
            transport_cost,
        }
    }

    fn estimate_transport_cost(&self, from_city: &str, to_city: &str, quantity: f64) -> f64 {
        // Simplified distance matrix (zones between cities)
        let distance = match (from_city, to_city) {
            ("Caerleon", "Bridgewatch") | ("Bridgewatch", "Caerleon") => 8,
            ("Caerleon", "Lymhurst") | ("Lymhurst", "Caerleon") => 8,
            ("Caerleon", "Martlock") | ("Martlock", "Caerleon") => 8,
            ("Caerleon", "Fort Sterling") | ("Fort Sterling", "Caerleon") => 8,
            ("Caerleon", "Thetford") | ("Thetford", "Caerleon") => 8,
            _ => 12, // Cross-royal city trades
        };

        // Base cost: 100 silver per zone, scales with quantity
        let weight_factor = (quantity / 100.0).max(1.0);
        (distance as f64) * 100.0 * weight_factor
    }
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! WASM is working!", name)
}
