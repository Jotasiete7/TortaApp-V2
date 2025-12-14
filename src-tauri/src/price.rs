use regex::Regex;

/// Normalizes Wurm Online prices to copper
/// 1g = 10,000c | 1s = 100c | 1c = 1c
pub fn parse_price_to_copper(price_str: &str) -> Option<i64> {
    let mut copper: i64 = 0;
    
    // Gold: 1g = 10,000c
    if let Some(caps) = Regex::new(r"(\d+)g").unwrap().captures(price_str) {
        if let Ok(val) = caps[1].parse::<i64>() {
            copper += val * 10_000;
        }
    }
    
    // Silver: 1s = 100c
    if let Some(caps) = Regex::new(r"(\d+)s").unwrap().captures(price_str) {
        if let Ok(val) = caps[1].parse::<i64>() {
            copper += val * 100;
        }
    }
    
    // Copper: 1c = 1c
    if let Some(caps) = Regex::new(r"(\d+)c").unwrap().captures(price_str) {
        if let Ok(val) = caps[1].parse::<i64>() {
            copper += val;
        }
    }
    
    if copper > 0 {
        Some(copper)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_gold() {
        assert_eq!(parse_price_to_copper("5g"), Some(50_000));
    }

    #[test]
    fn test_parse_silver() {
        assert_eq!(parse_price_to_copper("50s"), Some(5_000));
    }

    #[test]
    fn test_parse_copper() {
        assert_eq!(parse_price_to_copper("100c"), Some(100));
    }

    #[test]
    fn test_parse_mixed() {
        assert_eq!(parse_price_to_copper("1g50s"), Some(15_000));
        assert_eq!(parse_price_to_copper("5g50s100c"), Some(55_100));
    }

    #[test]
    fn test_parse_invalid() {
        assert_eq!(parse_price_to_copper("free"), None);
        assert_eq!(parse_price_to_copper(""), None);
    }
}
