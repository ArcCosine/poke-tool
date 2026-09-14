import os
import sys
import json
import urllib.request
import time
import re

DATA_DIR = "public/data"
CACHE_DIR = "scripts/cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def fetch_cached(url, filename):
    filepath = os.path.join(CACHE_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    print(f"Fetching: {url}")
    time.sleep(0.1)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return data
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

def get_ja_en_name(resource, default_name=""):
    ja = next((n["name"] for n in resource.get("names", []) if n["language"]["name"] == "ja"), default_name)
    en = next((n["name"] for n in resource.get("names", []) if n["language"]["name"] == "en"), default_name)
    return {"ja": ja, "en": en}

def main():
    # 1. Load existing data
    with open(f"{DATA_DIR}/pokemon_master.json", "r", encoding="utf-8") as f:
        pokemon_list = json.load(f)
    with open(f"{DATA_DIR}/moves_master.json", "r", encoding="utf-8") as f:
        moves_list = json.load(f)
    moves_map = {m["id"]: m for m in moves_list}

    # 2. Refresh items_master.json from GameWith article
    print("--- Refreshing items_master.json ---")
    with open("/home/arccosine/.gemini/antigravity-cli/brain/ff887b49-0639-4c56-ae91-d48b5a77c387/.system_generated/steps/4/content.md", "r", encoding="utf-8") as f:
        html_items = f.read()

    pattern = r"<li[^>]*data-name=[\x27\"]([^\x27\"]+)[\x27\"][^>]*>.*?<div class=[\x27\"]_section[\x27\"]><div class=[\x27\"]_label-0[\x27\"]>効果</div><div>(.*?)</div>"
    gw_items = re.findall(pattern, html_items, re.DOTALL)

    with open(f"{DATA_DIR}/items_master.json", "r", encoding="utf-8") as f:
        current_items = json.load(f)
    current_map = {item["name"]["ja"]: item for item in current_items}

    custom_en = {
        "ノーマルジュエル": "Normal Gem",
        "ヒメリのみ": "Leppa Berry",
        "オレンのみ": "Oran Berry",
        "ナモのみ": "Payapa Berry",
        "リザードナイトX": "Charizardite X",
        "リザードナイトY": "Charizardite Y",
        "オーダイルナイト": "Feraligatrite",
        "メガニウムナイト": "Meganiumite",
        "エンブオナイト": "Emboarite",
        "ガメノデスナイト": "Barbaracite",
        "スターミナイト": "Starmite",
        "ウツボットナイト": "Victreebelite",
        "カイリュナイト": "Dragonitite",
        "ユキメノコナイト": "Froslassite",
        "ルチャブルナイト": "Hawluchanite",
        "ジジーロナイト": "Drampanite",
        "シビルドナイト": "Eelektrossite",
        "タイレーツナイト": "Falinksite",
        "ペンドラナイト": "Scolipedite",
        "エアームドナイト": "Skarmorite",
        "ピクシナイト": "Clefablite",
        "ドラミドナイト": "Dragalgite",
        "ズルズキナイト": "Scraftite",
        "カエンジシナイト": "Pyroarite",
        "カラマネナイト": "Malamarite",
        "ドリュウズナイト": "Excadrillite",
        "シャンデラナイト": "Chandelurite",
        "ゲッコウガナイト": "Greninjite",
        "マフォクシナイト": "Delphoxite",
        "ブリガロナイト": "Chesnaughtite",
        "フラエッテナイト": "Floettite",
        "セグレイブナイト": "Baxcaliburite",
        "ルカリオナイトZ": "Lucarionite Z",
        "ライチュウナイトX": "Raichunite X",
        "ライチュウナイトY": "Raichunite Y",
        "アブソルナイトZ": "Absolite Z",
        "ムクホークナイト": "Staraptorite",
        "チリーンナイト": "Chimechonite",
        "ケケンカニナイト": "Crabominableite",
        "スコヴィラナイト": "Scovillainite",
        "ゴルーグナイト": "Golurkite",
        "ニャオニクスナイト": "Meowsticite",
        "グソクムシャナイト": "Golisopodite",
        "キラフロルナイト": "Glimmorite",
        "ガブリアスナイトZ": "Garchompite Z",
    }

    new_items = []
    seen_items = set()
    custom_item_id = 20001
    for name, _ in gw_items:
        clean_name = name.strip()
        if clean_name in seen_items:
            continue
        seen_items.add(clean_name)
        if clean_name in current_map and not clean_name.startswith("マスターボール") and not clean_name.endswith("ボール"):
            new_items.append(current_map[clean_name])
        elif clean_name in custom_en:
            new_items.append({
                "id": custom_item_id,
                "name": {
                    "ja": clean_name,
                    "en": custom_en[clean_name]
                }
            })
            custom_item_id += 1
        else:
            print(f"Warning: Unknown item: {clean_name}")

    new_items.append({
        "id": 99999,
        "name": {
            "ja": "なし",
            "en": "None"
        }
    })

    with open(f"{DATA_DIR}/items_master.json", "w", encoding="utf-8") as f:
        json.dump(new_items, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(new_items)} items to items_master.json")

    # Helper function to process a pokemon from PokeAPI
    def process_pokeapi_pokemon(pokemon_id, custom_ja_name=None, custom_en_name=None, regulations=["M-C"]):
        p_data = fetch_cached(f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}/", f"pokemon_{pokemon_id}.json")
        if not p_data:
            return None

        species_id = p_data["species"]["url"].split("/")[-2]
        s_data = fetch_cached(f"https://pokeapi.co/api/v2/pokemon-species/{species_id}/", f"species_{species_id}.json")
        
        names = get_ja_en_name(s_data)
        ja_name = custom_ja_name if custom_ja_name else names["ja"]
        en_name = custom_en_name if custom_en_name else names["en"]

        types = [t["type"]["name"] for t in p_data["types"]]

        stats = {
            "hp": next(s["base_stat"] for s in p_data["stats"] if s["stat"]["name"] == "hp"),
            "attack": next(s["base_stat"] for s in p_data["stats"] if s["stat"]["name"] == "attack"),
            "defense": next(s["base_stat"] for s in p_data["stats"] if s["stat"]["name"] == "defense"),
            "sp_attack": next(s["base_stat"] for s in p_data["stats"] if s["stat"]["name"] == "special-attack"),
            "sp_defense": next(s["base_stat"] for s in p_data["stats"] if s["stat"]["name"] == "special-defense"),
            "speed": next(s["base_stat"] for s in p_data["stats"] if s["stat"]["name"] == "speed"),
        }

        abilities = []
        for ab in p_data["abilities"]:
            ab_name = ab["ability"]["name"]
            ab_data = fetch_cached(ab["ability"]["url"], f"ability_{ab_name}.json")
            if ab_data:
                ab_names = get_ja_en_name(ab_data, ab_name)
                abilities.append(ab_names)

        learnable_moves = []
        for m in p_data["moves"]:
            m_url = m["move"]["url"]
            m_id = int(m_url.split("/")[-2])
            learnable_moves.append(m_id)
            if m_id not in moves_map:
                m_data = fetch_cached(m_url, f"move_{m_id}.json")
                if m_data:
                    m_names = get_ja_en_name(m_data, m_data.get("name", ""))
                    moves_map[m_id] = {
                        "id": m_id,
                        "name": m_names,
                        "type": m_data["type"]["name"],
                        "category": m_data["damage_class"]["name"],
                        "power": m_data.get("power") or 0,
                        "accuracy": m_data.get("accuracy") or 100,
                        "pp": m_data.get("pp") or 0
                    }

        return {
            "id": pokemon_id,
            "name": {"ja": ja_name, "en": en_name},
            "types": types,
            "base_stats": stats,
            "abilities": abilities,
            "regulations": regulations,
            "learnable_moves": sorted(list(set(learnable_moves)))
        }

    # 3. Add Rotom forms
    print("--- Adding Rotom forms ---")
    rotom_forms = [
        (10008, "ヒートロトム", "Rotom Heat"),
        (10009, "ウォッシュロトム", "Rotom Wash"),
        (10010, "フロストロトム", "Rotom Frost"),
        (10011, "スピンロトム", "Rotom Fan"),
        (10012, "カットロトム", "Rotom Mow"),
    ]
    # Ensure base Rotom (479) has M-C regulation as well
    base_rotom = next((p for p in pokemon_list if p["id"] == 479), None)
    if base_rotom and "M-C" not in base_rotom["regulations"]:
        base_rotom["regulations"].append("M-C")

    for r_id, ja_name, en_name in rotom_forms:
        existing_idx = next((i for i, p in enumerate(pokemon_list) if p["id"] == r_id), None)
        r_pokemon = process_pokeapi_pokemon(r_id, ja_name, en_name, regulations=["M-A", "M-B", "M-C"])
        if r_pokemon:
            if existing_idx is not None:
                pokemon_list[existing_idx] = r_pokemon
            else:
                pokemon_list.append(r_pokemon)
            print(f"Added/Updated: {ja_name} ({r_id})")

    # 4. Add M-C added Pokemon
    print("--- Adding Regulation M-C Pokemon ---")
    # Base national dex species for M-C
    mc_species = [
        (40, "プクリン", "Wigglytuff"),
        (53, "ペルシアン", "Persian"),
        (83, "カモネギ", "Farfetch'd"),
        (122, "バリヤード", "Mr. Mime"),
        (317, "マルノーム", "Swalot"),
        (373, "ボーマンダ", "Salamence"),
        (673, "ゴーゴート", "Gogoat"),
        (768, "グソクムシャ", "Golisopod"),
        (812, "ゴリランダー", "Rillaboom"),
        (815, "エースバーン", "Cinderace"),
        (818, "インテレオン", "Inteleon"),
        (828, "フォクスライ", "Thievul"),
        (849, "ストリンダー(ハイ)", "Toxtricity (Amped)"),
        (853, "オトスパス", "Grapploct"),
        (863, "ニャイキング", "Perrserker"),
        (865, "ネギガナイト", "Sirfetch'd"),
        (871, "バチンウニ", "Pincurchin"),
        (876, "イエッサン(オス)", "Indeedee (Male)"),
        (923, "パーモット", "Pawmot"),
        (930, "オリーヴァ", "Arboliva"),
        (931, "イキリンコ", "Squawkabilly"),
        (943, "マフィティフ", "Mabosstiff"),
        (998, "セグレイブ", "Baxcalibur"),
    ]
    for s_id, ja, en in mc_species:
        existing_idx = next((i for i, p in enumerate(pokemon_list) if p["id"] == s_id), None)
        poke = process_pokeapi_pokemon(s_id, ja, en, regulations=["M-C"])
        if poke:
            if existing_idx is not None:
                pokemon_list[existing_idx] = poke
            else:
                pokemon_list.append(poke)
            print(f"Added/Updated M-C species: {ja} ({s_id})")

    # Alternate forms / Regional forms
    mc_forms = [
        (10108, "アローラペルシアン", "Alolan Persian"),
        (10089, "メガボーマンダ", "Mega Salamence"),
        (10184, "ストリンダー(ロー)", "Toxtricity (Low Key)"),
        (10186, "イエッサン(メス)", "Indeedee (Female)"),
        (10260, "イキリンコ(ブルー)", "Squawkabilly (Blue)"),
        (10261, "イキリンコ(イエロー)", "Squawkabilly (Yellow)"),
        (10262, "イキリンコ(ホワイト)", "Squawkabilly (White)"),
    ]
    for f_id, ja, en in mc_forms:
        existing_idx = next((i for i, p in enumerate(pokemon_list) if p["id"] == f_id), None)
        poke = process_pokeapi_pokemon(f_id, ja, en, regulations=["M-C"])
        if poke:
            if existing_idx is not None:
                pokemon_list[existing_idx] = poke
            else:
                pokemon_list.append(poke)
            print(f"Added/Updated M-C form: {ja} ({f_id})")

    # Update Z-Megas and new Mega evolutions
    # 10307: メガアブソルZ
    idx_10307 = next((i for i, p in enumerate(pokemon_list) if p["id"] == 10307), None)
    if idx_10307 is not None:
        pokemon_list[idx_10307]["name"] = {"ja": "メガアブソルZ", "en": "Mega Absol Z"}
        pokemon_list[idx_10307]["abilities"] = [{"ja": "きれあじ", "en": "Sharpness"}]
        pokemon_list[idx_10307]["regulations"] = ["M-C"]
        print("Updated メガアブソルZ (10307)")

    # 10309: メガガブリアスZ
    idx_10309 = next((i for i, p in enumerate(pokemon_list) if p["id"] == 10309), None)
    if idx_10309 is not None:
        pokemon_list[idx_10309]["name"] = {"ja": "メガガブリアスZ", "en": "Mega Garchomp Z"}
        pokemon_list[idx_10309]["abilities"] = [{"ja": "ふゆう", "en": "Levitate"}]
        pokemon_list[idx_10309]["regulations"] = ["M-C"]
        print("Updated メガガブリアスZ (10309)")

    # 10310: メガルカリオZ
    idx_10310 = next((i for i, p in enumerate(pokemon_list) if p["id"] == 10310), None)
    if idx_10310 is not None:
        pokemon_list[idx_10310]["name"] = {"ja": "メガルカリオZ", "en": "Mega Lucario Z"}
        pokemon_list[idx_10310]["abilities"] = [{"ja": "はどうのぼうご", "en": "Aura Guard"}]
        pokemon_list[idx_10310]["regulations"] = ["M-C"]
        print("Updated メガルカリオZ (10310)")

    # 10327: メガグソクムシャ & 768: グソクムシャ
    # stats: 75-150-175-70-120-40, type: bug, steel, ability: かたいツメ
    # GameWith Champions movepool (including U-turn/とんぼがえり #369, Aqua Jet/アクアジェット #453, etc.)
    golisopod_mc_moves = [
        14, 42, 57, 58, 59, 63, 97, 103, 127, 141, 156, 157, 163, 164, 173, 180, 182, 188, 191, 196,
        203, 213, 214, 240, 263, 269, 280, 291, 317, 330, 334, 339, 341, 369, 370, 371, 372, 374, 389,
        398, 399, 400, 404, 405, 411, 416, 421, 441, 442, 450, 453, 458, 469, 474, 482, 496, 503, 522,
        529, 534, 555, 660, 675, 710, 806, 884, 886
    ]
    idx_768 = next((i for i, p in enumerate(pokemon_list) if p["id"] == 768), None)
    if idx_768 is not None:
        pokemon_list[idx_768]["learnable_moves"] = golisopod_mc_moves

    mega_golisopod = {
        "id": 10327,
        "name": {"ja": "メガグソクムシャ", "en": "Mega Golisopod"},
        "types": ["bug", "steel"],
        "base_stats": {
            "hp": 75,
            "attack": 150,
            "defense": 175,
            "sp_attack": 70,
            "sp_defense": 120,
            "speed": 40
        },
        "abilities": [{"ja": "かたいツメ", "en": "Tough Claws"}],
        "regulations": ["M-C"],
        "learnable_moves": golisopod_mc_moves
    }
    idx_10327 = next((i for i, p in enumerate(pokemon_list) if p["id"] == 10327), None)
    if idx_10327 is not None:
        pokemon_list[idx_10327] = mega_golisopod
    else:
        pokemon_list.append(mega_golisopod)
    print("Added/Updated メガグソクムシャ (10327)")

    # 10328: メガセグレイブ
    # stats: 115-175-117-105-101-87, type: dragon, ice, ability: ねつこうかん
    # inherits moves from Baxcalibur (998)
    baxcalibur = next((p for p in pokemon_list if p["id"] == 998), None)
    mega_bax = {
        "id": 10328,
        "name": {"ja": "メガセグレイブ", "en": "Mega Baxcalibur"},
        "types": ["dragon", "ice"],
        "base_stats": {
            "hp": 115,
            "attack": 175,
            "defense": 117,
            "sp_attack": 105,
            "sp_defense": 101,
            "speed": 87
        },
        "abilities": [{"ja": "ねつこうかん", "en": "Thermal Exchange"}],
        "regulations": ["M-C"],
        "learnable_moves": baxcalibur["learnable_moves"] if baxcalibur else []
    }
    idx_10328 = next((i for i, p in enumerate(pokemon_list) if p["id"] == 10328), None)
    if idx_10328 is not None:
        pokemon_list[idx_10328] = mega_bax
    else:
        pokemon_list.append(mega_bax)
    print("Added メガセグレイブ (10328)")

    # Ensure all existing pokemon have M-C if they had M-B
    for p in pokemon_list:
        if "M-B" in p["regulations"] and "M-C" not in p["regulations"]:
            p["regulations"].append("M-C")

    # Save pokemon_master.json
    with open(f"{DATA_DIR}/pokemon_master.json", "w", encoding="utf-8") as f:
        json.dump(pokemon_list, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(pokemon_list)} pokemon to pokemon_master.json")

    # Save moves_master.json
    with open(f"{DATA_DIR}/moves_master.json", "w", encoding="utf-8") as f:
        json.dump(list(moves_map.values()), f, ensure_ascii=False, indent=2)
    print(f"Saved {len(moves_map)} moves to moves_master.json")

    # Update version.json
    with open(f"{DATA_DIR}/version.json", "w", encoding="utf-8") as f:
        json.dump({"version": int(time.time() * 1000)}, f, ensure_ascii=False, indent=2)
    print("Updated version.json")

if __name__ == "__main__":
    main()
