use clap::Parser;
use std::path::{Path, PathBuf};
use std::env;
use std::fs;
use pure_onnx_ocr::OcrEngineBuilder;
use serde::{Deserialize, Serialize};

fn compare_json(expected: &serde_json::Value, actual: &serde_json::Value) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();
    
    fn val_to_str(v: &serde_json::Value) -> Option<String> {
        match v {
            serde_json::Value::String(s) => {
                let trimmed = s.trim();
                if trimmed.is_empty() { None } else { Some(trimmed.to_lowercase()) }
            }
            serde_json::Value::Null => None,
            _ => {
                let s = v.to_string();
                if s == "null" {
                    None
                } else {
                    Some(s.to_lowercase())
                }
            }
        }
    }

    let exp_st = val_to_str(&expected["screen_type"]);
    let act_st = val_to_str(&actual["screen_type"]);
    if exp_st != act_st {
        errors.push(format!("screen_type mismatch: expected {:?}, got {:?}", exp_st, act_st));
    }

    let exp_ab = &expected["ability"];
    let act_ab = &actual["ability"];
    for field in &["pokemon_name", "ability_name", "held_item"] {
        let exp_val = val_to_str(&exp_ab[field]);
        let act_val = val_to_str(&act_ab[field]);
        if exp_val != act_val {
            errors.push(format!("ability.{} mismatch: expected {:?}, got {:?}", field, exp_val, act_val));
        }
    }

    if let (Some(exp_moves), Some(act_moves)) = (exp_ab["moves"].as_array(), act_ab["moves"].as_array()) {
        let mut exp_m_strings: Vec<String> = exp_moves.iter().filter_map(val_to_str).collect();
        let mut act_m_strings: Vec<String> = act_moves.iter().filter_map(val_to_str).collect();
        exp_m_strings.sort();
        act_m_strings.sort();
        if exp_m_strings != act_m_strings {
            errors.push(format!("ability.moves mismatch: expected {:?}, got {:?}", exp_m_strings, act_m_strings));
        }
    }

    let exp_stats = &expected["stats"];
    let act_stats = &actual["stats"];
    for stat_name in &["hp", "attack", "defense", "sp_attack", "sp_defense", "speed"] {
        for sub_field in &["value", "points"] {
            let exp_val = exp_stats[stat_name][sub_field].as_i64();
            let act_val = act_stats[stat_name][sub_field].as_i64();
            if exp_val != act_val {
                errors.push(format!("stats.{}.{} mismatch: expected {:?}, got {:?}", stat_name, sub_field, exp_val, act_val));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to the pokemon screenshot image file (optional if --verify is used)
    #[arg(short, long)]
    image: Option<PathBuf>,

    /// Language to use for text recognition (ja, en, ko, auto)
    #[arg(short, long, default_value = "auto")]
    lang: String,

    /// Automatically run OCR and LLM structuring on all images in src/test/fixtures
    #[arg(long)]
    verify: bool,

    /// Path to the ONNX text detection model (det.onnx)
    #[arg(long, default_value = "public/models/det.onnx")]
    det_model: PathBuf,

    /// Path to the Japanese/English ONNX text recognition model (rec.onnx)
    #[arg(long, default_value = "public/models/rec.onnx")]
    rec_model: PathBuf,

    /// Path to the Korean ONNX text recognition model (rec_ko.onnx)
    #[arg(long, default_value = "public/models/rec_ko.onnx")]
    rec_ko_model: PathBuf,

    /// Path to the Japanese/English dictionary file
    #[arg(long, default_value = "public/models/ppocrv5_dict.txt")]
    dictionary: PathBuf,

    /// Path to the Korean dictionary file
    #[arg(long, default_value = "public/models/korean_dict.txt")]
    korean_dictionary: PathBuf,
}

// Gemini Request/Response Models
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GeminiRequest {
    contents: Vec<Content>,
    generation_config: GenerationConfig,
}

#[derive(Serialize)]
struct Content {
    parts: Vec<Part>,
}

#[derive(Serialize)]
struct Part {
    text: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerationConfig {
    response_mime_type: String,
}

#[derive(Deserialize, Debug)]
struct GeminiResponse {
    candidates: Option<Vec<Candidate>>,
}

#[derive(Deserialize, Debug)]
struct Candidate {
    content: ResponseContent,
}

#[derive(Deserialize, Debug)]
struct ResponseContent {
    parts: Vec<ResponsePart>,
}

#[derive(Deserialize, Debug)]
struct ResponsePart {
    text: String,
}

// Custom wrapper to hold OCR results
struct OcrRunResult {
    image_path: PathBuf,
    detected_lang: String,
    ocr_words: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    if !args.det_model.exists() {
        return Err(format!("Detection model file does not exist: {:?}", args.det_model).into());
    }

    // Determine the images to process
    let images_to_process = if args.verify {
        let fixtures_dir = Path::new("src/test/fixtures");
        if !fixtures_dir.exists() {
            return Err(format!("Fixtures directory does not exist: {:?}", fixtures_dir).into());
        }
        println!("Scanning fixtures directory: {:?}", fixtures_dir);
        let mut list = Vec::new();
        let verify_targets = ["2.jpg", "20260805170752.jpg", "20260808132849.png"];
        for entry in fs::read_dir(fixtures_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    let name_str = file_name.to_string_lossy();
                    if verify_targets.contains(&name_str.as_ref()) {
                        list.push(path);
                    }
                }
            }
        }
        // Sort files to make the output predictable
        list.sort();
        println!("Found {} images for verification.", list.len());
        list
    } else {
        if let Some(ref img_path) = args.image {
            if !img_path.exists() {
                return Err(format!("Image file does not exist: {:?}", img_path).into());
            }
            vec![img_path.clone()]
        } else {
            return Err("Please specify an image with --image or use --verify to run all tests.".into());
        }
    };

    if images_to_process.is_empty() {
        println!("No images to process.");
        return Ok(());
    }

    // Check availability of models and dictionaries
    if args.lang == "ko" || args.lang == "auto" {
        if !args.rec_ko_model.exists() {
            return Err(format!("Korean Recognition model file does not exist: {:?}", args.rec_ko_model).into());
        }
        if !args.korean_dictionary.exists() {
            return Err(format!("Korean Dictionary file does not exist: {:?}", args.korean_dictionary).into());
        }
    }
    if args.lang == "ja" || args.lang == "en" || args.lang == "auto" {
        if !args.rec_model.exists() {
            return Err(format!("Recognition model file does not exist: {:?}", args.rec_model).into());
        }
        if !args.dictionary.exists() {
            return Err(format!("Dictionary file does not exist: {:?}", args.dictionary).into());
        }
    }

    // Build engines
    let ja_en_engine = if args.lang == "ja" || args.lang == "en" || args.lang == "auto" {
        println!("Loading Japanese/English OCR Engine...");
        Some(
            OcrEngineBuilder::new()
                .det_model_path(args.det_model.to_str().unwrap())
                .rec_model_path(args.rec_model.to_str().unwrap())
                .dictionary_path(args.dictionary.to_str().unwrap())
                .det_limit_side_len(960)
                .det_unclip_ratio(1.5)
                .rec_batch_size(8)
                .build()?
        )
    } else {
        None
    };

    let ko_engine = if args.lang == "ko" || args.lang == "auto" {
        println!("Loading Korean OCR Engine...");
        Some(
            OcrEngineBuilder::new()
                .det_model_path(args.det_model.to_str().unwrap())
                .rec_model_path(args.rec_ko_model.to_str().unwrap())
                .dictionary_path(args.korean_dictionary.to_str().unwrap())
                .det_limit_side_len(960)
                .det_unclip_ratio(1.5)
                .rec_batch_size(8)
                .build()?
        )
    } else {
        None
    };

    let api_key = env::var("GEMINI_API_KEY").ok();
    if api_key.is_none() {
        println!("Note: GEMINI_API_KEY environment variable is not set. Will skip LLM structuring, running OCR verification only.");
    }

    let mut ocr_results = Vec::new();

    for img_path in &images_to_process {
        println!("\n==================================================");
        println!("Processing image: {:?}", img_path);
        println!("==================================================");

        let selected_results;
        let selected_lang;

        if args.lang == "ko" {
            println!("Running Korean OCR...");
            selected_results = ko_engine.as_ref().unwrap().run_from_path(img_path.to_str().unwrap())?;
            selected_lang = "ko".to_string();
        } else if args.lang == "ja" || args.lang == "en" {
            println!("Running Japanese/English OCR...");
            selected_results = ja_en_engine.as_ref().unwrap().run_from_path(img_path.to_str().unwrap())?;
            selected_lang = args.lang.clone();
        } else {
            // "auto" mode
            println!("Running Japanese/English OCR pass...");
            let results_ja = ja_en_engine.as_ref().unwrap().run_from_path(img_path.to_str().unwrap())?;
            let avg_conf_ja = if results_ja.is_empty() {
                0.0
            } else {
                results_ja.iter().map(|r| r.confidence).sum::<f32>() / results_ja.len() as f32
            };

            println!("Running Korean OCR pass...");
            let results_ko = ko_engine.as_ref().unwrap().run_from_path(img_path.to_str().unwrap())?;
            let avg_conf_ko = if results_ko.is_empty() {
                0.0
            } else {
                results_ko.iter().map(|r| r.confidence).sum::<f32>() / results_ko.len() as f32
            };

            println!("Japanese/English Engine Average Confidence: {:.4}", avg_conf_ja);
            println!("Korean Engine Average Confidence: {:.4}", avg_conf_ko);

            if avg_conf_ko > avg_conf_ja && avg_conf_ko > 0.35 {
                println!("Auto-detected language: Korean");
                selected_results = results_ko;
                selected_lang = "ko".to_string();
            } else {
                println!("Auto-detected language: Japanese/English");
                selected_results = results_ja;
                selected_lang = "ja".to_string();
            }
        }

        // Format OCR words
        let mut ocr_text_list = String::new();
        for (idx, result) in selected_results.iter().enumerate() {
            let points: Vec<_> = result.bounding_box.exterior().points().collect();
            let xs: Vec<f64> = points.iter().map(|p| p.x()).collect();
            let ys: Vec<f64> = points.iter().map(|p| p.y()).collect();
            let x_min = xs.iter().cloned().fold(f64::INFINITY, f64::min) as i32;
            let x_max = xs.iter().cloned().fold(f64::NEG_INFINITY, f64::max) as i32;
            let y_min = ys.iter().cloned().fold(f64::INFINITY, f64::min) as i32;
            let y_max = ys.iter().cloned().fold(f64::NEG_INFINITY, f64::max) as i32;

            ocr_text_list.push_str(&format!(
                "#{:02} [x:{}, y:{}, w:{}, h:{}] text=\"{}\" conf={:.4}\n",
                idx + 1,
                x_min,
                y_min,
                x_max - x_min,
                y_max - y_min,
                result.text,
                result.confidence
            ));
        }

        println!("OCR Text Output:\n{}", ocr_text_list);

        ocr_results.push(OcrRunResult {
            image_path: img_path.clone(),
            detected_lang: selected_lang,
            ocr_words: ocr_text_list,
        });
    }

    let mut verification_failed = false;

    // Run LLM structuring if api_key is available
    if let Some(key) = api_key {
        println!("\n==================================================");
        println!("Starting LLM Structuring Phase for All Images");
        println!("==================================================");

        let client = reqwest::Client::new();

        for ocr_res in ocr_results {
            println!("\n--- Structuring {:?} (Detected Language: {}) ---", ocr_res.image_path, ocr_res.detected_lang);
            
            let prompt = format!(
                r#"You are an expert Pokemon helper. Analyze the following OCR transcription from a Pokemon status or ability screen.
The image language is: {}. (Note: ja means Japanese or English, ko means Korean).
Please clean up the raw OCR text, correct typos, map items/moves/abilities to correct names, and extract the structured information in JSON format.

Determine the screen type:
- "ability": ability/moves list screen (contains Pokemon name, ability, item, and 4 moves)
- "status": stats status screen (contains HP, Attack, Defense, Sp. Atk, Sp. Def, Speed values and effort/stat points)

OCR TRANSCRIPTION DATA:
{}

OUTPUT SPECIFICATION (JSON schema):
{{
  "screen_type": "ability" | "status" | "unknown",
  "ability": {{
    "pokemon_name": "Pokemon name in the screenshot language (e.g. English, Japanese, or Korean)",
    "ability_name": "Ability name in the screenshot language",
    "held_item": "Held item name in the screenshot language",
    "moves": ["Move 1", "Move 2", "Move 3", "Move 4"]
  }},
  "stats": {{
    "hp": {{ "value": number | null, "points": number | null }},
    "attack": {{ "value": number | null, "points": number | null }},
    "defense": {{ "value": number | null, "points": number | null }},
    "sp_attack": {{ "value": number | null, "points": number | null }},
    "sp_defense": {{ "value": number | null, "points": number | null }},
    "speed": {{ "value": number | null, "points": number | null }}
  }}
}}

Provide ONLY the valid JSON without any markdown formatting wrappers or explanations."#,
                ocr_res.detected_lang,
                ocr_res.ocr_words
            );

            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
                key
            );

            let request_body = GeminiRequest {
                contents: vec![Content {
                    parts: vec![Part { text: prompt }],
                }],
                generation_config: GenerationConfig {
                    response_mime_type: "application/json".to_string(),
                },
            };

            let mut retries = 0;
            let mut response_opt = None;
            while retries < 5 {
                match client.post(&url).json(&request_body).send().await {
                    Ok(resp) => {
                        let status = resp.status();
                        if status.is_success() {
                            response_opt = Some(resp);
                            break;
                        } else if status.as_u16() == 429 || status.as_u16() == 503 || status.is_server_error() {
                            println!("Warning: API returned status {}. Retrying in {} seconds...", status, (retries + 1) * 10);
                            tokio::time::sleep(std::time::Duration::from_secs((retries + 1) * 10)).await;
                            retries += 1;
                        } else {
                            println!("Gemini request failed for {:?} with status: {}", ocr_res.image_path, status);
                            break;
                        }
                    }
                    Err(err) => {
                        println!("Failed to send Gemini request for {:?}: {:?}", ocr_res.image_path, err);
                        tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                        retries += 1;
                    }
                }
            }

            if let Some(response) = response_opt {
                if let Ok(gemini_resp) = response.json::<GeminiResponse>().await {
                    if let Some(candidates) = gemini_resp.candidates {
                        if let Some(candidate) = candidates.get(0) {
                            if let Some(part) = candidate.content.parts.get(0) {
                                let json_text = &part.text;
                                match serde_json::from_str::<serde_json::Value>(json_text) {
                                    Ok(parsed_json) => {
                                        println!("{}", serde_json::to_string_pretty(&parsed_json)?);
                                        
                                        // Check for expected snapshot JSON
                                        let expected_json_path = ocr_res.image_path.with_extension("json");
                                        if expected_json_path.exists() {
                                            println!("Verifying against expected snapshot: {:?}", expected_json_path);
                                            match fs::read_to_string(&expected_json_path) {
                                                Ok(expected_content) => {
                                                    match serde_json::from_str::<serde_json::Value>(&expected_content) {
                                                        Ok(expected_json) => {
                                                            match compare_json(&expected_json, &parsed_json) {
                                                                Ok(()) => {
                                                                    println!("Verification PASSED for {:?}", ocr_res.image_path);
                                                                }
                                                                Err(errors) => {
                                                                    println!("Verification FAILED for {:?}", ocr_res.image_path);
                                                                    for err in errors {
                                                                        println!("  - {}", err);
                                                                    }
                                                                    verification_failed = true;
                                                                }
                                                            }
                                                        }
                                                        Err(err) => {
                                                            println!("Error parsing expected JSON file: {:?}", err);
                                                            verification_failed = true;
                                                        }
                                                    }
                                                }
                                                Err(err) => {
                                                    println!("Error reading expected JSON file: {:?}", err);
                                                    verification_failed = true;
                                                }
                                            }
                                        } else {
                                            println!("Snapshot file not found. Creating snapshot: {:?}", expected_json_path);
                                            match serde_json::to_string_pretty(&parsed_json) {
                                                Ok(pretty_json) => {
                                                    if let Err(err) = fs::write(&expected_json_path, pretty_json) {
                                                        println!("Failed to write snapshot file: {:?}", err);
                                                        verification_failed = true;
                                                    } else {
                                                        println!("Snapshot created successfully.");
                                                    }
                                                }
                                                Err(err) => {
                                                    println!("Failed to serialize parsed JSON: {:?}", err);
                                                    verification_failed = true;
                                                }
                                            }
                                        }
                                    }
                                    Err(_) => {
                                        println!("Raw Response:\n{}", json_text);
                                        verification_failed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                println!("Warning: Gemini request failed permanently for {:?}. Verification skipped for this image.", ocr_res.image_path);
            }

            // Sleep for a short duration to avoid API rate limit (429 Too Many Requests)
            tokio::time::sleep(std::time::Duration::from_secs(10)).await;
        }
    }

    if verification_failed {
        return Err("Some image verifications failed.".into());
    }

    Ok(())
}
