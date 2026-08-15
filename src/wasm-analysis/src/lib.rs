use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn console_log(s: &str);
}

fn log_msg(s: &str) {
    #[cfg(target_arch = "wasm32")]
    console_log(s);
    #[cfg(not(target_arch = "wasm32"))]
    println!("{}", s);
}

#[wasm_bindgen]
pub fn init_logger() {
    log_msg("WASM-Analysis OCR module initialized.");
}

/// DBNet Post-Processing using Connected Component Labeling
/// Receives a flat probability map from the text detection model, binarizes it,
/// performs Connected Component Analysis (BFS), scales the boxes back to the original image size,
/// applies unclip padding, and returns a list of bounding boxes as `[x_min, y_min, x_max, y_max]` flat list.
#[wasm_bindgen]
pub fn dbnet_postprocess(
    prob_map: &[f32],
    map_w: u32,
    map_h: u32,
    orig_w: u32,
    orig_h: u32,
    thresh: f32,
    box_thresh: f32,
    unclip_ratio: f32,
) -> Vec<i32> {
    let w = map_w as usize;
    let h = map_h as usize;
    
    // 1. Binarize the probability map
    let mut binarized = vec![false; w * h];
    for i in 0..(w * h) {
        if i < prob_map.len() {
            binarized[i] = prob_map[i] >= thresh;
        }
    }
    
    // 2. Perform Connected Component Labeling using BFS
    let mut visited = vec![false; w * h];
    let mut rects = Vec::new();
    
    for y in 0..h {
        for x in 0..w {
            let idx = y * w + x;
            if binarized[idx] && !visited[idx] {
                let mut min_x = x;
                let mut max_x = x;
                let mut min_y = y;
                let mut max_y = y;
                
                let mut queue = std::collections::VecDeque::new();
                queue.push_back((x, y));
                visited[idx] = true;
                
                let mut sum_prob = 0.0;
                let mut count = 0;
                
                while let Some((cx, cy)) = queue.pop_front() {
                    let c_idx = cy * w + cx;
                    if c_idx < prob_map.len() {
                        sum_prob += prob_map[c_idx];
                        count += 1;
                    }
                    
                    if cx < min_x { min_x = cx; }
                    if cx > max_x { max_x = cx; }
                    if cy < min_y { min_y = cy; }
                    if cy > max_y { max_y = cy; }
                    
                    // 8-connectivity neighbors
                    for dy in -1..=1 {
                        for dx in -1..=1 {
                            if dx == 0 && dy == 0 { continue; }
                            let nx = cx as i32 + dx;
                            let ny = cy as i32 + dy;
                            if nx >= 0 && nx < map_w as i32 && ny >= 0 && ny < map_h as i32 {
                                let n_idx = (ny as usize) * w + (nx as usize);
                                if binarized[n_idx] && !visited[n_idx] {
                                    visited[n_idx] = true;
                                    queue.push_back((nx as usize, ny as usize));
                                }
                            }
                        }
                    }
                }
                
                // Filter components based on their average score
                let avg_prob = if count > 0 { sum_prob / count as f32 } else { 0.0 };
                if avg_prob < box_thresh {
                    continue;
                }
                
                // Scale factors to map coordinates back to the original resolution
                let scale_x = orig_w as f32 / map_w as f32;
                let scale_y = orig_h as f32 / map_h as f32;
                
                let mut rx_min = min_x as f32 * scale_x;
                let mut rx_max = (max_x + 1) as f32 * scale_x;
                let mut ry_min = min_y as f32 * scale_y;
                let mut ry_max = (max_y + 1) as f32 * scale_y;
                
                // Horizontal unclip logic (expand bounding box proportionally)
                let rw = rx_max - rx_min;
                let rh = ry_max - ry_min;
                let area = rw * rh;
                let perimeter = 2.0 * (rw + rh);
                if perimeter > 0.0 {
                    let distance = area * unclip_ratio / perimeter;
                    rx_min = (rx_min - distance).max(0.0);
                    rx_max = (rx_max + distance).min(orig_w as f32);
                    ry_min = (ry_min - distance).max(0.0);
                    ry_max = (ry_max + distance).min(orig_h as f32);
                }
                
                // Filter out very small/noisy bounding boxes
                let final_w = rx_max - rx_min;
                let final_h = ry_max - ry_min;
                if final_w >= 10.0 && final_h >= 8.0 {
                    rects.push(rx_min as i32);
                    rects.push(ry_min as i32);
                    rects.push(rx_max as i32);
                    rects.push(ry_max as i32);
                }
            }
        }
    }
    
    rects
}

/// CTC Greedy Decoder for text recognition
/// Maps raw model outputs (TimeStep x ClassNum) back to text using a custom dictionary string (newlines delimited)
#[wasm_bindgen]
pub fn ctc_decode(
    preds: &[f32],
    timesteps: u32,
    num_classes: u32,
    dict_str: &str,
) -> String {
    let t_len = timesteps as usize;
    let c_len = num_classes as usize;
    
    // Split dictionary lines
    let dict: Vec<&str> = dict_str.lines().collect();
    
    let mut last_idx = -1i32;
    let mut decoded_indices = Vec::new();
    
    for t in 0..t_len {
        let start_idx = t * c_len;
        let mut max_val = -3.40282347e+38f32; // f32::MIN
        let mut max_idx = 0;
        
        for c in 0..c_len {
            let idx = start_idx + c;
            if idx < preds.len() {
                let val = preds[idx];
                if val > max_val {
                    max_val = val;
                    max_idx = c;
                }
            }
        }
        
        // Index 0 represents blank character token in PaddleOCR
        let idx = max_idx as i32;
        if idx != 0 && idx != last_idx {
            decoded_indices.push(idx);
        }
        last_idx = idx;
    }
    
    // Decode index sequence to string representation
    let mut result = String::new();
    for &idx in &decoded_indices {
        // PaddleOCR character indices are 1-based, index 0 is blank
        let char_idx = (idx - 1) as usize;
        if char_idx < dict.len() {
            result.push_str(dict[char_idx]);
        }
    }
    
    result
}

#[wasm_bindgen]
pub fn get_16_9_bounds_robust(raw_pixels: &[u8], w: u32, h: u32) -> Vec<u32> {
    // Centered Y-Edge Scan (x range: 25% to 75% of width to ignore clocks/battery icons on sides)
    let mut row_diffs = vec![0.0f32; h as usize];
    let x_start = (w as f32 * 0.25) as u32;
    let x_end = (w as f32 * 0.75) as u32;
    let scan_w = x_end - x_start;

    for y in 0..h {
        let mut diff_sum = 0.0;
        for x in (x_start + 1)..x_end {
            let idx1 = ((y * w + x) * 4) as usize;
            let idx2 = ((y * w + x - 1) * 4) as usize;
            if idx1 + 2 < raw_pixels.len() {
                let r1 = raw_pixels[idx1] as f32;
                let g1 = raw_pixels[idx1 + 1] as f32;
                let b1 = raw_pixels[idx1 + 2] as f32;
                let r2 = raw_pixels[idx2] as f32;
                let g2 = raw_pixels[idx2 + 1] as f32;
                let b2 = raw_pixels[idx2 + 2] as f32;
                diff_sum += (r1 - r2).abs() + (g1 - g2).abs() + (b1 - b2).abs();
            }
        }
        row_diffs[y as usize] = diff_sum / scan_w as f32;
    }

    let threshold = 2.5;
    let mut top = 0;
    for y in 0..h {
        if row_diffs[y as usize] > threshold {
            top = y;
            break;
        }
    }
    let mut bottom = h - 1;
    for y in (0..h).rev() {
        if row_diffs[y as usize] > threshold {
            bottom = y;
            break;
        }
    }

    // Centered X-Edge Scan (y range: 25% to 75% of height to ignore system navigation bars)
    let mut col_diffs = vec![0.0f32; w as usize];
    let y_start = (h as f32 * 0.25) as u32;
    let y_end = (h as f32 * 0.75) as u32;
    let scan_h = y_end - y_start;

    for x in 0..w {
        let mut diff_sum = 0.0;
        for y in (y_start + 1)..y_end {
            let idx1 = ((y * w + x) * 4) as usize;
            let idx2 = (((y - 1) * w + x) * 4) as usize;
            if idx1 + 2 < raw_pixels.len() {
                let r1 = raw_pixels[idx1] as f32;
                let g1 = raw_pixels[idx1 + 1] as f32;
                let b1 = raw_pixels[idx1 + 2] as f32;
                let r2 = raw_pixels[idx2] as f32;
                let g2 = raw_pixels[idx2 + 1] as f32;
                let b2 = raw_pixels[idx2 + 2] as f32;
                diff_sum += (r1 - r2).abs() + (g1 - g2).abs() + (b1 - b2).abs();
            }
        }
        col_diffs[x as usize] = diff_sum / scan_h as f32;
    }

    let mut left = 0;
    for x in 0..w {
        if col_diffs[x as usize] > threshold {
            left = x;
            break;
        }
    }
    let mut right = w - 1;
    for x in (0..w).rev() {
        if col_diffs[x as usize] > threshold {
            right = x;
            break;
        }
    }

    let viewport_w = right - left + 1;
    let viewport_h = bottom - top + 1;

    let aspect = viewport_w as f32 / viewport_h as f32;
    let target_aspect = 16.0 / 9.0;

    let (final_x, final_y, final_w, final_h) = if (aspect - target_aspect).abs() < 0.02 {
        (left, top, viewport_w, viewport_h)
    } else if aspect > target_aspect {
        let display_w = (viewport_h as f32 * target_aspect).round() as u32;
        let x_offset = left + (viewport_w - display_w) / 2;
        (x_offset, top, display_w, viewport_h)
    } else {
        let display_h = (viewport_w as f32 / target_aspect).round() as u32;
        let y_offset = top + (viewport_h - display_h) / 2;
        (left, y_offset, viewport_w, display_h)
    };

    vec![final_x, final_y, final_w, final_h]
}

#[wasm_bindgen]
pub fn get_binary_pixels(raw_pixels: &[u8], w: u32, h: u32) -> Vec<u8> {
    let mut result = Vec::with_capacity((w * h) as usize);
    for i in 0..(w * h) as usize {
        let idx = i * 4;
        if idx + 2 < raw_pixels.len() {
            let r = raw_pixels[idx] as f32;
            let g = raw_pixels[idx + 1] as f32;
            let b = raw_pixels[idx + 2] as f32;
            let y = 0.299 * r + 0.587 * g + 0.114 * b;
            if y >= 100.0 {
                result.push(1);
            } else {
                result.push(0);
            }
        } else {
            result.push(0);
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ctc_decode_basic() {
        let dict = "A\nB\nC\nD";
        // Timestep 4, Classes 5 (Blank, A, B, C, D)
        // Preds structure: timestep 0 [0.1, 0.9, 0.0, 0.0, 0.0] -> index 1 ('A')
        //                  timestep 1 [0.9, 0.1, 0.0, 0.0, 0.0] -> index 0 (blank)
        //                  timestep 2 [0.1, 0.0, 0.9, 0.0, 0.0] -> index 2 ('B')
        //                  timestep 3 [0.1, 0.0, 0.9, 0.0, 0.0] -> index 2 ('B' - duplicate, merged)
        let preds = vec![
            0.1, 0.9, 0.0, 0.0, 0.0,
            0.9, 0.1, 0.0, 0.0, 0.0,
            0.1, 0.0, 0.9, 0.0, 0.0,
            0.1, 0.0, 0.9, 0.0, 0.0,
        ];
        let decoded = ctc_decode(&preds, 4, 5, dict);
        assert_eq!(decoded, "AB");
    }

    #[test]
    fn test_dbnet_postprocess_simple() {
        // Map 3x3, Orig 30x30
        let prob_map = vec![
            0.0, 0.0, 0.0,
            0.0, 0.9, 0.0,
            0.0, 0.0, 0.0,
        ];
        let boxes = dbnet_postprocess(&prob_map, 3, 3, 30, 30, 0.5, 0.5, 1.5);
        // Average prob of detected region is 0.9 (>= 0.5).
        // scale_x = 10, scale_y = 10.
        // min_x=1, max_x=1 -> rx_min = 10, rx_max = 20.
        // min_y=1, max_y=1 -> ry_min = 10, ry_max = 20.
        // Expanded by unclip.
        assert!(boxes.len() >= 4);
    }

    #[test]
    fn test_get_binary_pixels() {
        let pixels = vec![255, 255, 255, 255, 0, 0, 0, 255];
        let bin = get_binary_pixels(&pixels, 2, 1);
        assert_eq!(bin, vec![1, 0]);
    }
}
