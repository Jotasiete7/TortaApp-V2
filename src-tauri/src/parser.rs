use crate::price::parse_price_to_copper;
use regex::Regex;

#[derive(Clone, serde::Serialize, Debug)]
pub struct ParsedTrade {
    pub timestamp: String,
    pub nick: String,
    pub message: String,
    pub trade_type: Option<String>,
    pub item: Option<String>,
    pub quality: Option<u8>,
    pub rarity: Option<String>,
    pub price_copper: Option<i64>,
}

pub struct AdvancedParser {
    ql_regex: Regex,
    rarity_regex: Regex,
}

impl AdvancedParser {
    pub fn new() -> Self {
        Self {
            ql_regex: Regex::new(r"(?i)ql\s*(\d+)").unwrap(),
            rarity_regex: Regex::new(r"(?i)(rare|supreme|fantastic)").unwrap(),
        }
    }

    pub fn parse(&self, timestamp: String, nick: String, message: String) -> ParsedTrade {
        let tokens = self.tokenize(&message);
        let trade_type = self.extract_trade_type(&tokens);
        let quality = self.extract_quality(&message);
        let rarity = self.extract_rarity(&message);
        let price_copper = self.extract_price(&message);
        let item = self.extract_item(&message, &trade_type);

        ParsedTrade {
            timestamp,
            nick,
            message,
            trade_type,
            item,
            quality,
            rarity,
            price_copper,
        }
    }

    fn tokenize<'a>(&self, message: &'a str) -> Vec<&'a str> {
        message.split_whitespace().collect()
    }

    fn extract_trade_type(&self, tokens: &[&str]) -> Option<String> {
        for token in tokens {
            let upper = token.to_uppercase();
            if upper == "WTS" || upper == "WTB" || upper == "WTT" {
                return Some(upper);
            }
        }
        None
    }

    fn extract_quality(&self, message: &str) -> Option<u8> {
        self.ql_regex
            .captures(message)
            .and_then(|caps| caps.get(1))
            .and_then(|m| m.as_str().parse::<u8>().ok())
    }

    fn extract_rarity(&self, message: &str) -> Option<String> {
        self.rarity_regex
            .captures(message)
            .map(|caps| caps.get(1).unwrap().as_str().to_lowercase())
    }

    fn extract_price(&self, message: &str) -> Option<i64> {
        let price_regex = Regex::new(r"(\d+[gsc])+").unwrap();
        price_regex
            .find(message)
            .and_then(|m| parse_price_to_copper(m.as_str()))
    }

    fn extract_item(&self, message: &str, trade_type: &Option<String>) -> Option<String> {
        if trade_type.is_none() {
            return None;
        }
        
        let mut item_parts: Vec<&str> = vec![];
        let tokens = self.tokenize(message);
        let mut skip_next = false;
        let mut found_trade_type = false;

        for token in tokens {
            if skip_next {
                skip_next = false;
                continue;
            }

            let upper = token.to_uppercase();
            if upper == "WTS" || upper == "WTB" || upper == "WTT" {
                found_trade_type = true;
                continue;
            }

            if !found_trade_type {
                continue;
            }

            if upper == "QL" || upper == "RARE" || upper == "SUPREME" || upper == "FANTASTIC" {
                if upper == "QL" {
                    skip_next = true;
                }
                continue;
            }

            if Regex::new(r"\d+[gsc]").unwrap().is_match(token) {
                break;
            }

            item_parts.push(token);
        }

        if item_parts.is_empty() {
            None
        } else {
            Some(item_parts.join(" "))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize() {
        let parser = AdvancedParser::new();
        let tokens = parser.tokenize("WTS rare pickaxe QL 90 5g");
        assert_eq!(tokens, vec!["WTS", "rare", "pickaxe", "QL", "90", "5g"]);
    }

    #[test]
    fn test_extract_trade_type() {
        let parser = AdvancedParser::new();
        let tokens = vec!["WTS", "pickaxe"];
        assert_eq!(parser.extract_trade_type(&tokens), Some("WTS".to_string()));
    }

    #[test]
    fn test_extract_quality() {
        let parser = AdvancedParser::new();
        assert_eq!(parser.extract_quality("WTS pickaxe QL 90"), Some(90));
        assert_eq!(parser.extract_quality("WTS pickaxe quality 85"), Some(85));
    }

    #[test]
    fn test_extract_rarity() {
        let parser = AdvancedParser::new();
        assert_eq!(parser.extract_rarity("WTS rare pickaxe"), Some("rare".to_string()));
        assert_eq!(parser.extract_rarity("WTS supreme axe"), Some("supreme".to_string()));
    }

    #[test]
    fn test_full_parse() {
        let parser = AdvancedParser::new();
        let result = parser.parse(
            "10:23:45".to_string(),
            "TestPlayer".to_string(),
            "WTS rare pickaxe QL 90 5g".to_string(),
        );

        assert_eq!(result.trade_type, Some("WTS".to_string()));
        assert_eq!(result.quality, Some(90));
        assert_eq!(result.rarity, Some("rare".to_string()));
        assert_eq!(result.price_copper, Some(50_000));
        assert_eq!(result.item, Some("pickaxe".to_string()));
    }
}
