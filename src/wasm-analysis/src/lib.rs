use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn init_logger() {
    log("WASM-Analysis module initialized.");
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Convert RGB to HSV for robust color thresholding
fn rgb_to_hsv(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    let r = r as f32 / 255.0;
    let g = g as f32 / 255.0;
    let b = b as f32 / 255.0;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let mut h = 0.0;
    if delta > 0.0 {
        if max == r {
            h = ((g - b) / delta) % 6.0;
        } else if max == g {
            h = ((b - r) / delta) + 2.0;
        } else {
            h = ((r - g) / delta) + 4.0;
        }
        h *= 60.0;
        if h < 0.0 {
            h += 360.0;
        }
    }

    let s = if max == 0.0 { 0.0 } else { delta / max };
    let v = max;

    (h, s, v)
}

// Check if HSV pixel matches the cyan color of the effort values radar chart in game
fn is_cyan_effort_color(h: f32, s: f32, v: f32) -> bool {
    // Cyan color typically lies in Hue range [160, 210] with moderate saturation and value
    h >= 160.0 && h <= 220.0 && s >= 0.3 && v >= 0.4
}

// Analyze radar chart image and return 6 values [HP, Atk, Def, SpA, SpD, Spe]
#[wasm_bindgen]
pub fn analyze_radar_chart(image_data: &[u8], width: u32, height: u32) -> Vec<u8> {
    log("Analyzing radar chart pixels in Rust...");

    // 1. Calculate centroid (center of the chart) by averaging cyan pixel coordinates
    let mut sum_x = 0;
    let mut sum_y = 0;
    let mut count = 0;

    for y in 0..height {
        for x in 0..width {
            let idx = ((y * width + x) * 4) as usize;
            if idx + 2 >= image_data.len() {
                continue;
            }
            let r = image_data[idx];
            let g = image_data[idx + 1];
            let b = image_data[idx + 2];

            let (h, s, v) = rgb_to_hsv(r, g, b);
            if is_cyan_effort_color(h, s, v) {
                sum_x += x;
                sum_y += y;
                count += 1;
            }
        }
    }

    // Default chart center to image center if no cyan pixel detected
    let center_x = if count > 0 { (sum_x / count) as f32 } else { width as f32 / 2.0 };
    let center_y = if count > 0 { (sum_y / count) as f32 } else { height as f32 / 2.0 };

    // 6 directions for stats (in radians, starting from HP (top = -PI/2) going clockwise)
    // HP (Top): -90 deg (-PI/2)
    // Attack (Right Top): -30 deg (-PI/6)
    // Defense (Right Bottom): 30 deg (PI/6)
    // Speed (Bottom): 90 deg (PI/2)
    // Sp.Defense (Left Bottom): 150 deg (5*PI/6)
    // Sp.Attack (Left Top): -150 deg (-5*PI/6)
    let angles = [
        -std::f32::consts::FRAC_PI_2,               // HP
        -std::f32::consts::FRAC_PI_6,               // Attack
        std::f32::consts::FRAC_PI_6,                // Defense
        std::f32::consts::FRAC_PI_2,                // Speed
        5.0 * std::f32::consts::FRAC_PI_6,          // Sp.Defense
        -5.0 * std::f32::consts::FRAC_PI_6,         // Sp.Attack
    ];

    let max_radius = (width.min(height) as f32) / 2.0;
    let mut stats = vec![0u8; 6];

    // 2. Raycast from center to edge of cyan pixels in 6 directions
    for (i, &angle) in angles.iter().enumerate() {
        let cos = angle.cos();
        let sin = angle.sin();
        let mut edge_dist = 0.0;

        // Trace ray step-by-step
        for step in 1..=(max_radius as i32) {
            let r_val = step as f32;
            let check_x = (center_x + r_val * cos) as i32;
            let check_y = (center_y + r_val * sin) as i32;

            if check_x < 0 || check_x >= width as i32 || check_y < 0 || check_y >= height as i32 {
                break;
            }

            let idx = ((check_y * width as i32 + check_x) * 4) as usize;
            if idx + 2 >= image_data.len() {
                break;
            }

            let r_pix = image_data[idx];
            let g_pix = image_data[idx + 1];
            let b_pix = image_data[idx + 2];

            let (h, s, v) = rgb_to_hsv(r_pix, g_pix, b_pix);
            if is_cyan_effort_color(h, s, v) {
                edge_dist = r_val;
            }
        }

        // Map ray distance to effort values range [0, 252]
        // Assuming max_radius represents the maximum possible EV (252)
        let ratio = if max_radius > 0.0 { edge_dist / max_radius } else { 0.0 };
        // Scale to 252 effort points
        let ev = (ratio * 252.0).round() as u8;
        
        // Simple smoothing / thresholding (round to nearest common EVs if very close)
        stats[i] = if ev > 248 { 252 } else if ev < 8 { 0 } else { ev };
    }

    stats
}
