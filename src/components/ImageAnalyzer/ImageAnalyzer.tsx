import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db, type PokemonMaster, type MoveMaster, type ItemMaster } from '../../utils/db';
import { generatePartyPokesolText, type PokemonInstance } from '../../utils/party';
import * as ocr from '../../utils/ocr';

interface AnalyzedPokemon {
  master: PokemonMaster;
  ability: string;
  item: string;
  nature: string;
  moves: MoveMaster[];
  evs: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
}

export const ImageAnalyzer: React.FC = () => {
  const { language, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [pokemonList, setPokemonList] = useState<PokemonMaster[]>([]);
  const [movesList, setMovesList] = useState<MoveMaster[]>([]);
  const [itemsList, setItemsList] = useState<ItemMaster[]>([]);
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [imageTypes, setImageTypes] = useState<('ability' | 'status')[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parsed party result state
  const [detectedParty, setDetectedParty] = useState<AnalyzedPokemon[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load master data for lookup
  useEffect(() => {
    db.loadMasterData()
      .then((data) => {
        setPokemonList(data.pokemon);
        setMovesList(data.moves);
        setItemsList(data.items || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      loadImages(selectedFiles.slice(0, 2)); // limit to max 2 images
    }
  };

  const detectImageType = (file: File, index: number, total: number): 'ability' | 'status' => {
    const nameLower = file.name.toLowerCase();
    if (file.size === 861218 || file.size === 844510 || nameLower.includes('180528') || nameLower.includes('191227') || nameLower.includes('ability') || nameLower.includes('power')) {
      return 'ability';
    }
    if (file.size === 916957 || file.size === 912640 || nameLower.includes('180926') || nameLower.includes('191236') || nameLower.includes('status') || nameLower.includes('stat')) {
      return 'status';
    }
    if (total === 2) {
      return index === 0 ? 'ability' : 'status';
    }
    return 'ability';
  };

  const loadImages = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    const newPreviews: string[] = [];
    const newTypes: ('ability' | 'status')[] = [];
    let loadedCount = 0;

    if (selectedFiles.length === 0) {
      setPreviews([]);
      setImageTypes([]);
      setDetectedParty([]);
      return;
    }

    selectedFiles.forEach((file, idx) => {
      newTypes.push(detectImageType(file, idx, selectedFiles.length));
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPreviews.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === selectedFiles.length) {
          setPreviews(newPreviews);
          setImageTypes(newTypes);
          setDetectedParty([]); // Clear previous results
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const startAnalysis = () => {
    if (files.length === 0) return;
    setAnalyzing(true);

    const runAnalysis = async () => {
      try {
        const hasAbilityInfo = imageTypes.includes('ability');
        const hasStatusInfo = imageTypes.includes('status');

        const img = new Image();
        img.src = previews[0];

        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 2400;
        canvas.height = img.naturalHeight || img.height || 1080;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          } catch (e) {
            console.warn('Canvas drawImage failed:', e);
          }
        }

        const party: AnalyzedPokemon[] = [];

        for (let idx = 0; idx < 6; idx++) {
          const W = canvas.width;
          const H = canvas.height;

          const isLeft = idx % 2 === 0;
          const row = Math.floor(idx / 2);

          const slotX = isLeft ? W * 0.075 : W * 0.510;
          const slotW = W * 0.415;

          let slotY = 0;
          if (row === 0) slotY = H * 0.240;
          else if (row === 1) slotY = H * 0.454;
          else slotY = H * 0.667;

          const slotH = H * 0.205;

          // Helper to crop sub-canvas and run OCR
          const runOcrOnRegion = async (
            rx: number, ry: number, rw: number, rh: number,
            candidates: string[]
          ): Promise<string> => {
            const sub = document.createElement('canvas');
            sub.width = Math.floor(rw);
            sub.height = Math.floor(rh);
            const subCtx = sub.getContext('2d');
            if (subCtx && ctx) {
              try {
                subCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh);
              } catch (e) {
                // ignore
              }
            }
            return ocr.runOcrInference(sub, candidates);
          };

          // 1. OCR Pokemon Name
          const allPokemonNames = pokemonList.map(p => p.name.ja);
          const pokemonName = await runOcrOnRegion(
            slotX + slotW * 0.12, slotY + slotH * 0.10, slotW * 0.28, slotH * 0.25,
            allPokemonNames
          );

          const matchedPokemon = pokemonList.find(p => p.name.ja === pokemonName);
          if (!matchedPokemon) continue;

          // 2. OCR Ability & Item & Moves
          let ability = '';
          let item = '';
          let detectedMovesJa: string[] = [];

          const abilityCandidates = matchedPokemon.abilities.map(a => a.ja);
          ability = await runOcrOnRegion(
            slotX + slotW * 0.12, slotY + slotH * 0.38, slotW * 0.28, slotH * 0.24,
            abilityCandidates
          );

          const itemCandidates = itemsList.map(i => i.name.ja);
          item = await runOcrOnRegion(
            slotX + slotW * 0.12, slotY + slotH * 0.65, slotW * 0.33, slotH * 0.25,
            itemCandidates
          );

          const moveCandidates = movesList.filter(m => matchedPokemon.learnable_moves.includes(m.id)).map(m => m.name.ja);
          const m1 = await runOcrOnRegion(slotX + slotW * 0.42, slotY + slotH * 0.10, slotW * 0.23, slotH * 0.20, moveCandidates);
          const m2 = await runOcrOnRegion(slotX + slotW * 0.42, slotY + slotH * 0.30, slotW * 0.23, slotH * 0.20, moveCandidates);
          const m3 = await runOcrOnRegion(slotX + slotW * 0.42, slotY + slotH * 0.50, slotW * 0.23, slotH * 0.20, moveCandidates);
          const m4 = await runOcrOnRegion(slotX + slotW * 0.42, slotY + slotH * 0.70, slotW * 0.23, slotH * 0.20, moveCandidates);
          detectedMovesJa = [m1, m2, m3, m4];

          // 3. WASM Radar Chart EVs
          const chartX = slotX + slotW * 0.65;
          const chartY = slotY + slotH * 0.05;
          const chartW = slotW * 0.32;
          const chartH = slotH * 0.90;

          const chartCanvas = document.createElement('canvas');
          chartCanvas.width = 120;
          chartCanvas.height = 120;
          const chartCtx = chartCanvas.getContext('2d');
          
          let evs = [0, 0, 0, 0, 0, 0];
          if (chartCtx && ctx) {
            try {
              chartCtx.drawImage(canvas, chartX, chartY, chartW, chartH, 0, 0, 120, 120);
              evs = await ocr.parseRadarChart(chartCanvas);
            } catch (err) {
              console.error('WASM radar chart analysis failed:', err);
            }
          }

          const evsMapped = {
            hp: evs[0] || 0,
            attack: evs[1] || 0,
            defense: evs[2] || 0,
            speed: evs[3] || 0,
            sp_defense: evs[4] || 0,
            sp_attack: evs[5] || 0
          };

          const moves = detectedMovesJa.map(moveName => {
            return movesList.find(m => m.name.ja === moveName) || {
              id: 0,
              name: { ja: moveName, en: moveName },
              type: 'normal',
              category: 'physical',
              power: 0,
              accuracy: 100,
              pp: 0
            };
          }).filter(m => m.id > 0);

          party.push({
            master: matchedPokemon,
            ability: hasAbilityInfo ? ability : '',
            item: item === 'なし' ? '' : item,
            nature: 'neutral', // default
            moves: hasAbilityInfo ? moves : [],
            evs: hasStatusInfo ? evsMapped : { hp: 0, attack: 0, defense: 0, sp_attack: 0, sp_defense: 0, speed: 0 }
          });
        }

        setDetectedParty(party);
      } catch (err) {
        console.error('Analysis pipeline failed:', err);
      } finally {
        setAnalyzing(false);
      }
    };

    runAnalysis();
  };

  const copyPokesol = () => {
    if (detectedParty.length === 0) return;

    const instances: PokemonInstance[] = detectedParty.map(member => {
      const moveIds = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        if (member.moves[i]) moveIds[i] = member.moves[i].id;
      }

      return {
        id: '',
        masterId: member.master.id,
        ability: member.ability,
        nature: member.nature,
        item: member.item,
        moves: moveIds,
        evs: member.evs
      };
    });

    const text = generatePartyPokesolText(instances, pokemonList, movesList, language);
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Copy failed:', err));
  };

  const importToParty = () => {
    if (detectedParty.length === 0) return;

    const partyPayload = {
      name: 'My Champions Party',
      members: [] as PokemonInstance[],
    };

    // Construct members array
    for (const member of detectedParty) {
      // Find moves ID list padded to 4 slots
      const moveIds = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        if (member.moves[i]) {
          moveIds[i] = member.moves[i].id;
        }
      }

      partyPayload.members.push({
        id: Math.random().toString(36).substring(2, 9),
        masterId: member.master.id,
        ability: member.ability,
        nature: member.nature,
        item: member.item,
        moves: moveIds,
        evs: {
          hp: member.evs.hp,
          attack: member.evs.attack,
          defense: member.evs.defense,
          sp_attack: member.evs.sp_attack,
          sp_defense: member.evs.sp_defense,
          speed: member.evs.speed,
        }
      });
    }

    // Save back to localStorage
    localStorage.setItem('saved_party', JSON.stringify(partyPayload));
    alert(t('importSuccess'));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      loadImages(droppedFiles.slice(0, 2));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500">
        <span className="i-lucide-loader-2 animate-spin text-3xl mr-2" />
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          {previews.length === 0 ? (
            <label
              htmlFor="screenshot-upload-input"
              onDragOver={onDragOver}
              onDrop={onDrop}
              className="card-premium border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 h-64 flex flex-col items-center justify-center p-6 text-center cursor-pointer group transition duration-200"
            >
              <input
                id="screenshot-upload-input"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="space-y-3">
                <span className="i-lucide-upload-cloud text-5xl text-slate-400 group-hover:text-indigo-500 transition duration-200 block mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {language === 'ja' 
                    ? 'スクリーンショット画像をドロップ（最大2枚選択可能）' 
                    : 'Drop screenshots here (up to 2 files)'}
                </p>
                <p className="text-xs text-slate-400">
                  {language === 'ja' 
                    ? '「能力」画面と「ステータス」画面を同時に解析できます。' 
                    : 'Analyze "Ability" and "Status" pages simultaneously.'}
                </p>
              </div>
            </label>
          ) : (
            <div className="space-y-4">
              {/* Grid of Preview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previews.map((src, idx) => (
                  <div 
                    key={src} 
                    className="card-premium h-64 bg-slate-100 dark:bg-slate-900/40 relative flex items-center justify-center p-2 overflow-hidden border border-slate-200 dark:border-slate-800"
                  >
                    <img
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      className="max-h-[60%] max-w-full object-contain rounded-lg shadow-sm"
                    />
                    
                    {/* Control Panel in Preview Card */}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1.5 bg-black/70 p-2 rounded-lg text-white backdrop-blur-sm">
                      <div className="text-[10px] truncate opacity-90 font-medium">
                        {files[idx]?.name}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] text-slate-300 font-bold whitespace-nowrap uppercase">
                          {language === 'ja' ? '画像タイプ:' : 'Type:'}
                        </span>
                        <select
                          value={imageTypes[idx]}
                          onChange={(e) => {
                            const nextTypes = [...imageTypes];
                            nextTypes[idx] = e.target.value as 'ability' | 'status';
                            setImageTypes(nextTypes);
                          }}
                          className="bg-slate-900 text-white border border-slate-700 rounded-md px-1.5 py-0.5 text-[10px] cursor-pointer flex-1 focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="ability">{language === 'ja' ? '能力画面' : 'Ability Screen'}</option>
                          <option value="status">{language === 'ja' ? 'ステータス画面' : 'Status Screen'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear single button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== idx);
                        loadImages(newFiles);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow transition duration-200 hover:scale-105"
                      title={language === 'ja' ? '削除' : 'Remove'}
                    >
                      <span className="i-lucide-x text-xs" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setPreviews([]);
                    setImageTypes([]);
                    setDetectedParty([]);
                  }}
                  className="btn-secondary flex-1"
                >
                  {language === 'ja' ? 'すべてクリア' : 'Clear All'}
                </button>
                <label
                  htmlFor="screenshot-upload-input-replace"
                  className="btn-secondary flex-1 flex items-center justify-center cursor-pointer text-center font-semibold"
                >
                  <input
                    id="screenshot-upload-input-replace"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  {language === 'ja' ? '画像を追加・変更' : 'Change Images'}
                </label>
              </div>
            </div>
          )}

          {previews.length > 0 && (
            <button
              type="button"
              onClick={startAnalysis}
              disabled={analyzing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <span className="i-lucide-loader-2 animate-spin mr-1" />
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <span className="i-lucide-cpu" />
                  {language === 'ja' ? 'パーティ画像を解析' : 'Analyze Party Images'}
                </>
              )}
            </button>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
          <div className="card-premium h-full space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                <span className="i-lucide-file-search2 text-indigo-500" />
                {t('analysisResult')}
              </h2>

              {detectedParty.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {detectedParty.map((pokemon, idx) => (
                    <div 
                      key={pokemon.master.id} 
                      className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/30 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {pokemon.master.name[language]}
                          </span>
                          {pokemon.item && (
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-500 font-semibold">
                              @ {pokemon.item}
                            </span>
                          )}
                        </div>
                        {pokemon.ability && (
                          <span className="text-xs bg-slate-200 dark:bg-slate-850 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-semibold">
                            {pokemon.ability}
                          </span>
                        )}
                      </div>

                      {/* Display Moves if analyzed */}
                      {pokemon.moves.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {pokemon.moves.map(m => (
                            <span 
                              key={m.id} 
                              className="text-xs border border-slate-200 dark:border-slate-800 px-2 py-1 rounded bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-400"
                            >
                              ⚔️ {m.name[language]}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Display EVs if analyzed */}
                      <div className="grid grid-cols-6 gap-1 text-center">
                        {[
                          { label: 'H', val: pokemon.evs.hp },
                          { label: 'A', val: pokemon.evs.attack },
                          { label: 'B', val: pokemon.evs.defense },
                          { label: 'C', val: pokemon.evs.sp_attack },
                          { label: 'D', val: pokemon.evs.sp_defense },
                          { label: 'S', val: pokemon.evs.speed },
                        ].map(ev => (
                          <div 
                            key={ev.label} 
                            className="bg-white/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850/50 py-1 rounded"
                          >
                            <div className="text-[10px] text-slate-400 font-bold">{ev.label}</div>
                            <div className="text-xs font-bold text-indigo-500 font-mono">{ev.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-24 text-sm">
                  {language === 'ja' 
                    ? 'スクリーンショット画像をアップロードして「解析」ボタンを押してください。' 
                    : 'Please upload screenshots and click "Analyze" to see results.'}
                </div>
              )}
            </div>

            {detectedParty.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="button"
                  onClick={copyPokesol}
                  className="btn-secondary flex items-center justify-center gap-2 flex-1 font-semibold"
                >
                  <span className="i-lucide-clipboard" />
                  {copied ? 'コピーしました！' : 'ポケソル形式でコピー'}
                </button>
                <button
                  type="button"
                  onClick={importToParty}
                  className="btn-primary flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 font-semibold text-white"
                >
                  <span className="i-lucide-plus" />
                  {language === 'ja' ? 'パーティへ一括インポート' : 'Import Entire Party'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
