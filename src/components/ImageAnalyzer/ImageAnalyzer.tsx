import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db, type PokemonMaster } from '../../utils/db';
import { parseRadarChart, runOcrInference } from '../../utils/ocr';
import type { PokemonInstance } from '../../utils/party';

export const ImageAnalyzer: React.FC = () => {
  const { language, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [pokemonList, setPokemonList] = useState<PokemonMaster[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Analysis result states
  const [detectedPokemon, setDetectedPokemon] = useState<PokemonMaster | null>(
    null
  );
  const [parsedEvs, setParsedEvs] = useState<number[]>([0, 0, 0, 0, 0, 0]); // [HP, Atk, Def, Spe, SpD, SpA]

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load pokemon list for lookup on mount
  useEffect(() => {
    db.loadMasterData()
      .then((data) => setPokemonList(data.pokemon))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        // Clear previous results
        setDetectedPokemon(null);
        setParsedEvs([0, 0, 0, 0, 0, 0]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Draw image to hidden canvas for pixel scanning
  const drawImageToCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed analysis dimensions for consistent scaling
    canvas.width = 400;
    canvas.height = 400;
    ctx.drawImage(img, 0, 0, 400, 400);
  };

  const startAnalysis = () => {
    if (!imageSrc) return;
    setAnalyzing(true);

    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      try {
        drawImageToCanvas(img);
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 1. Run WASM efforts radar chart scanning
        const evs = await parseRadarChart(canvas);
        setParsedEvs(evs);

        // 2. Run ONNX OCR text recognition (mock outputs "カイリュー")
        const ocrText = await runOcrInference(canvas);

        // Match recognized text to master pokemon list
        const matched = pokemonList.find(
          (p) =>
            p.name.ja.includes(ocrText) ||
            p.name.en.toLowerCase().includes(ocrText.toLowerCase())
        );

        if (matched) {
          setDetectedPokemon(matched);
        } else {
          // Default fallback to Dragonite (カイリュー, ID 149) for demonstration if no match
          const fallback =
            pokemonList.find((p) => p.id === 149) || pokemonList[0] || null;
          setDetectedPokemon(fallback);
        }
      } catch (err) {
        console.error('Analysis failed:', err);
      } finally {
        setAnalyzing(false);
      }
    };
  };

  const importToParty = () => {
    if (!detectedPokemon) return;

    // Load saved party
    const saved = localStorage.getItem('saved_party');
    let partyPayload = {
      name: 'My Champions Party',
      reg: 'M-A',
      members: [] as PokemonInstance[],
    };

    if (saved) {
      try {
        partyPayload = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    // Ensure we have up to 6 slots
    if (partyPayload.members.length === 0) {
      partyPayload.members = Array.from({ length: 1 }, () => ({
        id: Math.random().toString(36).substring(2, 9),
        masterId: 0,
        ability: '',
        nature: 'neutral',
        moves: [0, 0, 0, 0],
        evs: {
          hp: 0,
          attack: 0,
          defense: 0,
          sp_attack: 0,
          sp_defense: 0,
          speed: 0,
        },
      }));
    }

    // Find the first empty slot or add a new one if < 6
    let targetIdx = partyPayload.members.findIndex((m) => m.masterId === 0);

    if (targetIdx === -1) {
      if (partyPayload.members.length < 6) {
        // Append slot
        const newSlot = {
          id: Math.random().toString(36).substring(2, 9),
          masterId: 0,
          ability: '',
          nature: 'neutral',
          moves: [0, 0, 0, 0],
          evs: {
            hp: 0,
            attack: 0,
            defense: 0,
            sp_attack: 0,
            sp_defense: 0,
            speed: 0,
          },
        };
        partyPayload.members.push(newSlot);
        targetIdx = partyPayload.members.length - 1;
      } else {
        alert(t('noEmptySlot'));
        return;
      }
    }

    // Map WASM Evs: [HP, Atk, Def, Spe, SpD, SpA] (Order returned by WASM angles)
    // to slot EVs: { hp, attack, defense, speed, sp_defense, sp_attack }
    const evHp = parsedEvs[0] || 0;
    const evAtk = parsedEvs[1] || 0;
    const evDef = parsedEvs[2] || 0;
    const evSpe = parsedEvs[3] || 0;
    const evSpD = parsedEvs[4] || 0;
    const evSpA = parsedEvs[5] || 0;

    partyPayload.members[targetIdx] = {
      ...partyPayload.members[targetIdx],
      masterId: detectedPokemon.id,
      ability: detectedPokemon.abilities[0]?.ja || '',
      evs: {
        hp: evHp,
        attack: evAtk,
        defense: evDef,
        sp_attack: evSpA,
        sp_defense: evSpD,
        speed: evSpe,
      },
    };

    // Save back to localStorage
    localStorage.setItem('saved_party', JSON.stringify(partyPayload));
    alert(t('importSuccess'));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadImage(file);
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 space-y-4">
          <label
            htmlFor="screenshot-upload-input"
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="card-premium border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 min-h-64 flex flex-col items-center justify-center p-6 text-center cursor-pointer group transition duration-200 block"
          >
            <input
              id="screenshot-upload-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Upload preview"
                className="max-h-64 rounded-lg object-contain shadow-md"
              />
            ) : (
              <div className="space-y-3">
                <span className="i-lucide-upload-cloud text-5xl text-slate-400 group-hover:text-indigo-500 transition duration-200 block mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {t('uploadPrompt')}
                </p>
              </div>
            )}
          </label>

          {imageSrc && (
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
                  {t('analyze')}
                </>
              )}
            </button>
          )}
        </div>

        {/* Results Panel */}
        <div className="md:col-span-6">
          <div className="card-premium h-full space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                <span className="i-lucide-file-search2 text-indigo-500" />
                {t('analysisResult')}
              </h2>

              {detectedPokemon ? (
                <div className="space-y-6">
                  {/* Pokémon Name Result */}
                  <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                    <label
                      htmlFor="pokemon-result-display"
                      className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider"
                    >
                      {t('detectedPokemon')}
                    </label>
                    <div
                      id="pokemon-result-display"
                      className="text-lg font-bold text-slate-800 dark:text-slate-200"
                    >
                      {detectedPokemon.name[language]}
                    </div>
                  </div>

                  {/* Effort Values Results */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {t('radarChartStats')}
                    </h3>

                    {/* EVs [HP, Atk, Def, Spe, SpD, SpA] */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: t('hp'), val: parsedEvs[0] },
                        { label: t('attack'), val: parsedEvs[1] },
                        { label: t('defense'), val: parsedEvs[2] },
                        { label: t('speed'), val: parsedEvs[3] },
                        { label: t('sp_defense'), val: parsedEvs[4] },
                        { label: t('sp_attack'), val: parsedEvs[5] },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/10 p-2.5 rounded-xl flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-slate-500">
                            {item.label}
                          </span>
                          <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                            {item.val || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16 text-sm">
                  {t('uploadInstruction')}
                </div>
              )}
            </div>

            {detectedPokemon && (
              <button
                type="button"
                onClick={importToParty}
                className="btn-primary w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2 mt-4"
              >
                <span className="i-lucide-plus" />
                {t('importToParty')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Canvas for Scan operations */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
