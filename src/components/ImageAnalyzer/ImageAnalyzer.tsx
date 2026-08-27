import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { db, type PokemonMaster, type MoveMaster, type ItemMaster } from '../../utils/db';
import { analyzePokemonImage, processOcrResults, estimateGridLayout, type OcrAnalysisResponse, type CustomSlotZone } from '../../utils/ocr';
import type { ProcessedOCRData } from '../../utils/ocrFuzzy';
import { Autocomplete } from '../common/Autocomplete';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Checkbox } from '../common/Checkbox';

interface ImageAnalyzerProps {
  onImportComplete: () => void;
}

const DEFAULT_ZONES: CustomSlotZone[] = [
  { id: 0, x: 0.05, y: 0.05, w: 0.42, h: 0.28 },
  { id: 1, x: 0.53, y: 0.05, w: 0.42, h: 0.28 },
  { id: 2, x: 0.05, y: 0.36, w: 0.42, h: 0.28 },
  { id: 3, x: 0.53, y: 0.36, w: 0.42, h: 0.28 },
  { id: 4, x: 0.05, y: 0.67, w: 0.42, h: 0.28 },
  { id: 5, x: 0.53, y: 0.67, w: 0.42, h: 0.28 },
];

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onImportComplete }) => {
  // Master data
  const [pokemonData, setPokemonData] = useState<PokemonMaster[]>([]);
  const [movesData, setMovesData] = useState<MoveMaster[]>([]);
  const [itemsData, setItemsData] = useState<ItemMaster[]>([]);
  const [abilityList, setAbilityList] = useState<string[]>([]);
  
  // UI states
  const [status, setStatus] = useState<'idle' | 'loading_models' | 'ready' | 'analyzing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // OCR raw response & parameters
  const [rawOcrResponse, setRawOcrResponse] = useState<OcrAnalysisResponse | null>(null);
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(3);

  // Custom zones annotation editor states
  const [customZones, setCustomZones] = useState<CustomSlotZone[]>([]);
  const [isEditingZones, setIsEditingZones] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<{
    zoneId: number;
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    startZone: { x: number; y: number; w: number; h: number };
  } | null>(null);

  // Grouped OCR slot data states
  const [ocrData, setOcrData] = useState<ProcessedOCRData[]>([]);
  const [importSelected, setImportSelected] = useState<boolean[]>([]);

  // DOM Refs for Debug Overlay Drawing
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load master data and saved custom zones on mount
  useEffect(() => {
    db.loadMasterData()
      .then((data) => {
        setPokemonData(data.pokemon);
        setMovesData(data.moves);
        setItemsData(data.items);
        
        // Extract unique abilities
        const abSet = new Set<string>();
        for (const p of data.pokemon) {
          for (const ab of p.abilities) {
            if (ab.ja) abSet.add(ab.ja);
          }
        }
        setAbilityList(Array.from(abSet));
      })
      .catch(console.error);

    const savedZones = localStorage.getItem('ocr_custom_zones');
    if (savedZones) {
      try {
        setCustomZones(JSON.parse(savedZones));
      } catch (e) {
        console.error('Failed to load custom zones template:', e);
      }
    }
  }, []);

  // Recalculate OCR slot grouping when raw results, master data or customZones change
  useEffect(() => {
    if (!rawOcrResponse || pokemonData.length === 0) return;

    const pokemonNames = pokemonData.map(p => p.name.ja);
    
    // 1. Estimate layout grid if custom zones are not set
    const layout = estimateGridLayout(
      rawOcrResponse.results,
      rawOcrResponse.width,
      rawOcrResponse.height,
      pokemonNames
    );

    setCols(layout.cols);
    setRows(layout.rows);

    // 2. Classify text results into slots (using custom zones if available)
    processOcrResults(
      rawOcrResponse.results,
      rawOcrResponse.width,
      rawOcrResponse.height,
      customZones.length > 0 ? customZones : undefined
    ).then((processed) => {
      setOcrData(processed);
      // Auto-check slots that parsed a valid pokemon (not placeholder fallback)
      setImportSelected(processed.map(p => p.pokemonName !== '認識できませんでした'));
    }).catch(err => {
      console.error('Failed to parse grid slots:', err);
    });
  }, [rawOcrResponse, pokemonData, customZones]);

  // Handle visual zone dragging logic on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDrag || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      const deltaX = (e.clientX - activeDrag.startX) / rect.width;
      const deltaY = (e.clientY - activeDrag.startY) / rect.height;
      
      setCustomZones(prev => {
        const current = prev.length > 0 ? prev : DEFAULT_ZONES.map(z => ({ ...z }));
        const next = current.map(z => {
          if (z.id !== activeDrag.zoneId) return z;
          if (activeDrag.type === 'move') {
            const newX = Math.max(0, Math.min(1 - activeDrag.startZone.w, activeDrag.startZone.x + deltaX));
            const newY = Math.max(0, Math.min(1 - activeDrag.startZone.h, activeDrag.startZone.y + deltaY));
            return { ...z, x: newX, y: newY };
          } else {
            const newW = Math.max(0.05, Math.min(1 - activeDrag.startZone.x, activeDrag.startZone.w + deltaX));
            const newH = Math.max(0.05, Math.min(1 - activeDrag.startZone.y, activeDrag.startZone.h + deltaY));
            return { ...z, w: newW, h: newH };
          }
        });
        return next;
      });
    };

    const handleMouseUp = () => {
      if (activeDrag) {
        setActiveDrag(null);
      }
    };

    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag]);

  // Handle canvas overlay drawing for debugging
  useEffect(() => {
    const drawBoxes = () => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img || !rawOcrResponse || isEditingZones) return;

      const rect = img.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = rect.width / rawOcrResponse.width;
      const scaleY = rect.height / rawOcrResponse.height;

      // Draw grid divisions or custom zones (dashed purple lines)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const isCustom = customZones.length > 0;
      if (isCustom) {
        for (const zone of customZones) {
          const zx = zone.x * rect.width;
          const zy = zone.y * rect.height;
          const zw = zone.w * rect.width;
          const zh = zone.h * rect.height;
          ctx.strokeRect(zx, zy, zw, zh);
          
          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
          ctx.fillText(`スロット ${zone.id + 1}`, zx + 4, zy + 12);
        }
      } else {
        const colWidth = rect.width / cols;
        const rowHeight = rect.height / rows;

        for (let c = 1; c < cols; c++) {
          ctx.beginPath();
          ctx.moveTo(c * colWidth, 0);
          ctx.lineTo(c * colWidth, rect.height);
          ctx.stroke();
        }

        for (let r = 1; r < rows; r++) {
          ctx.beginPath();
          ctx.moveTo(0, r * rowHeight);
          ctx.lineTo(rect.width, r * rowHeight);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]); // Reset line dash

      // Draw each recognized text box
      ctx.lineWidth = 1;
      for (const item of rawOcrResponse.results) {
        const x = item.x * scaleX;
        const y = item.y * scaleY;
        const w = item.w * scaleX;
        const h = item.h * scaleY;

        // Box border and semi-transparent fill
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(x, y, w, h);

        // Text label
        ctx.font = '8px sans-serif';
        const textWidth = ctx.measureText(item.text).width;
        ctx.fillStyle = '#ef4444';
        const labelY = y - 10 > 0 ? y - 10 : 0;
        ctx.fillRect(x, labelY, textWidth + 4, 10);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.text, x + 2, labelY + 8);
      }
    };

    const timer = setTimeout(drawBoxes, 150);
    window.addEventListener('resize', drawBoxes);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', drawBoxes);
    };
  }, [rawOcrResponse, cols, rows, customZones, isEditingZones]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }
    
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setRawOcrResponse(null);
    setOcrData([]);
    setErrorMessage('');
    
    runAnalysis(file);
  };

  const runAnalysis = async (file: File) => {
    setStatus('analyzing');
    try {
      const response = await analyzePokemonImage(file);
      setRawOcrResponse(response);
      setStatus('ready');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || '画像解析中にエラーが発生しました。');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Zone editor actions
  const handleZoneMouseDown = (e: React.MouseEvent, zoneId: number, type: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    const zonesSource = customZones.length > 0 ? customZones : DEFAULT_ZONES;
    const zone = zonesSource.find(z => z.id === zoneId) || DEFAULT_ZONES[zoneId];
    setActiveDrag({
      zoneId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      startZone: { ...zone }
    });
  };

  const saveCustomZones = () => {
    const zonesToSave = customZones.length > 0 ? customZones : DEFAULT_ZONES.map(z => ({ ...z }));
    localStorage.setItem('ocr_custom_zones', JSON.stringify(zonesToSave));
    setCustomZones(zonesToSave);
    setIsEditingZones(false);
    alert('分割範囲レイアウトを保存（学習）しました。以降この範囲が自動適用されます。');
  };

  const resetCustomZones = () => {
    if (confirm('分割範囲の設定を初期配置にリセットしますか？')) {
      localStorage.removeItem('ocr_custom_zones');
      setCustomZones([]);
      setIsEditingZones(false);
    }
  };

  // Input editing handlers per slot index
  const updateSlotField = (slotIdx: number, field: keyof Omit<ProcessedOCRData, 'stats' | 'moves'>, value: string) => {
    setOcrData(prev => {
      const next = [...prev];
      next[slotIdx] = {
        ...next[slotIdx],
        [field]: value
      };
      return next;
    });
  };

  const updateSlotMove = (slotIdx: number, moveIdx: number, value: string) => {
    setOcrData(prev => {
      const next = [...prev];
      const newMoves = [...next[slotIdx].moves];
      newMoves[moveIdx] = value;
      next[slotIdx] = {
        ...next[slotIdx],
        moves: newMoves
      };
      return next;
    });
  };

  const updateSlotStat = (slotIdx: number, stat: keyof ProcessedOCRData['stats'], value: string) => {
    setOcrData(prev => {
      const next = [...prev];
      const parsed = parseInt(value, 10);
      next[slotIdx] = {
        ...next[slotIdx],
        stats: {
          ...next[slotIdx].stats,
          [stat]: isNaN(parsed) ? null : parsed
        }
      };
      return next;
    });
  };

  const handleToggleImportSelected = (idx: number, val: boolean) => {
    setImportSelected(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleImportToParty = () => {
    const selectedSlots = ocrData.map((data, idx) => ({ data, idx })).filter(item => importSelected[item.idx]);
    if (selectedSlots.length === 0) {
      alert('インポートするポケモンを選択してください。');
      return;
    }

    // Verify all checked pokemon names match something valid in pokemonData list
    const invalidSlots = selectedSlots.filter(item => !pokemonData.some(p => p.name.ja === item.data.pokemonName));
    if (invalidSlots.length > 0) {
      alert(`以下のスロットのポケモン名が正しくありません。\n${invalidSlots.map(item => `スロット ${item.idx + 1}: ${item.data.pokemonName}`).join('\n')}`);
      return;
    }

    try {
      const savedPartyStr = localStorage.getItem('saved_party');
      let partyName = 'マイチャンピオンズパーティ';
      let members: any[] = [];

      if (savedPartyStr) {
        const parsed = JSON.parse(savedPartyStr);
        if (parsed.name) partyName = parsed.name;
        if (parsed.members) members = parsed.members;
      }

      // Max 6 members constraint check
      const totalAfterImport = members.length + selectedSlots.length;
      if (totalAfterImport > 6) {
        alert(`パーティの最大枠（6匹）をオーバーしています。\n現在の編成: ${members.length}匹\nインポート対象: ${selectedSlots.length}匹\n空き枠を確保した上でやり直してください。`);
        return;
      }

      // Append new slots
      for (const item of selectedSlots) {
        const ocrPoke = item.data;
        const matchedMaster = pokemonData.find(p => p.name.ja === ocrPoke.pokemonName)!;
        const mappedMoveIds = ocrPoke.moves.map(moveName => {
          const move = movesData.find(m => m.name.ja === moveName);
          return move ? move.id : 0;
        });

        const newInstance = {
          id: Math.random().toString(36).substring(2, 9),
          masterId: matchedMaster.id,
          ability: ocrPoke.ability === '認識できませんでした' ? '' : ocrPoke.ability,
          nature: 'neutral',
          item: ocrPoke.item === '認識できませんでした' ? '' : ocrPoke.item,
          moves: mappedMoveIds,
          evs: {
            hp: ocrPoke.stats.hp || 0,
            attack: ocrPoke.stats.attack || 0,
            defense: ocrPoke.stats.defense || 0,
            sp_attack: ocrPoke.stats.spAttack || 0,
            sp_defense: ocrPoke.stats.spDefense || 0,
            speed: ocrPoke.stats.speed || 0,
          }
        };
        members.push(newInstance);
      }

      localStorage.setItem('saved_party', JSON.stringify({ name: partyName, members }));
      alert(`${selectedSlots.length}匹のポケモンをパーティに追加しました！`);
      onImportComplete();
    } catch (err) {
      console.error(err);
      alert('インポート処理に失敗しました。');
    }
  };

  const selectPokemonNames = pokemonData.map(p => p.name.ja);
  const selectItemNames = itemsData.map(i => i.name.ja);
  const selectMoveNames = movesData.map(m => m.name.ja);

  const fallbackWarning = (val: string) => {
    return val === '認識できませんでした' ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300' : '';
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
          <span className="i-lucide-camera text-indigo-500" />
          画像分析 (OCR)
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          レンタルチーム画面などのスクリーンショット画像から6体分のデータを自動で認識し、パーティシミュレーターへ一括インポートします。
        </p>
      </div>

      {status === 'loading_models' && (
        <div className="card-premium flex flex-col items-center justify-center p-8 text-center space-y-4">
          <span className="i-lucide-loader-2 text-4xl text-indigo-500 animate-spin" />
          <h3 className="font-semibold text-lg">AIモデルを読み込んでいます</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            初回起動時はモデルファイルのダウンロード（約120MB）が行われるため、しばらく時間がかかります。2回目以降は瞬時に起動します。
          </p>
        </div>
      )}

      {status !== 'loading_models' && (
        <div className="space-y-8">
          {/* Top Panel: File Upload & Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Preview & Drop Area */}
            <div className="lg:col-span-2 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[250px] relative ${
                  imagePreview ? 'cursor-default border-slate-200 dark:border-slate-800' : 'cursor-pointer border-slate-300 dark:border-slate-800 hover:border-indigo-500/50'
                } ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : ''
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div ref={containerRef} className="relative inline-block max-w-full select-none">
                    <img
                      ref={imageRef}
                      src={imagePreview}
                      alt="Upload preview"
                      className="max-h-[380px] rounded-lg shadow-md object-contain max-w-full pointer-events-none"
                    />
                    
                    {/* Visual custom zones editor overlay */}
                    {isEditingZones && (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-auto bg-black/25 rounded-lg overflow-hidden">
                        {(customZones.length > 0 ? customZones : DEFAULT_ZONES).map((zone) => (
                          <div
                            key={`zone-edit-${zone.id}`}
                            onMouseDown={(e) => handleZoneMouseDown(e, zone.id, 'move')}
                            className="absolute border-2 border-emerald-500 bg-emerald-500/15 cursor-move rounded-md flex flex-col justify-between"
                            style={{
                              left: `${zone.x * 100}%`,
                              top: `${zone.y * 100}%`,
                              width: `${zone.w * 100}%`,
                              height: `${zone.h * 100}%`,
                              zIndex: activeDrag?.zoneId === zone.id ? 50 : 10
                            }}
                          >
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-sm w-fit select-none pointer-events-none">
                              スロット {zone.id + 1}
                            </span>
                            
                            {/* Resize handle in bottom-right corner */}
                            <div
                              onMouseDown={(e) => handleZoneMouseDown(e, zone.id, 'resize')}
                              className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border border-white cursor-se-resize rounded-tl-sm rounded-br-sm flex items-center justify-center shadow"
                              title="ドラッグしてサイズ変更"
                            >
                              <span className="i-lucide-move-diagonal-2 text-[8px] text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isEditingZones && rawOcrResponse && (
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-slate-400">
                    <span className="i-lucide-upload-cloud text-5xl mx-auto block" />
                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                      画像をドラッグ＆ドロップするか、クリックしてアップロード
                    </p>
                    <p className="text-xs text-slate-500">
                      対応フォーマット: PNG, JPG, GIF
                    </p>
                  </div>
                )}
              </div>

              {imagePreview && (
                <div className="flex justify-between items-center gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    icon="i-lucide-refresh-cw"
                  >
                    別の画像を選択
                  </Button>
                </div>
              )}

              {status === 'analyzing' && (
                <div className="flex items-center justify-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-sm">
                  <span className="i-lucide-loader-2 animate-spin" />
                  画像を分析しています... (テキスト行抽出 & 文字認識実行中)
                </div>
              )}

              {status === 'error' && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200/50 text-sm">
                  <h4 className="font-bold flex items-center gap-2 mb-1">
                    <span className="i-lucide-alert-circle" />
                    エラーが発生しました
                  </h4>
                  <p className="text-xs">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* Visual Zone Config Tool */}
            <div className="card-premium space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <span className="i-lucide-settings text-indigo-500" />
                  OCR コントロール
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  画像上のテキストは自動で解析・分割され、6体分のスロットに振り分けられます。
                </p>

                {imagePreview && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
                    <label className="text-xs font-bold text-slate-500 block">
                      範囲分割の学習・調整ツール
                    </label>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      レイアウトが特殊な場合は、ドラッグ操作で切り出す範囲枠を定義し「学習（保存）」できます。
                    </p>

                    {isEditingZones ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={saveCustomZones}
                          variant="primary"
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-600 hover:border-emerald-500 text-white"
                          icon="i-lucide-check"
                        >
                          範囲を保存
                        </Button>
                        <Button
                          onClick={() => setIsEditingZones(false)}
                          variant="secondary"
                          className="text-xs"
                          icon="i-lucide-x"
                        >
                          キャンセル
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setIsEditingZones(true)}
                          variant="secondary"
                          className="text-xs w-full text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                          icon="i-lucide-maximize-2"
                        >
                          分割範囲をマウスで調整する
                        </Button>
                        {customZones.length > 0 && (
                          <Button
                            onClick={resetCustomZones}
                            variant="secondary"
                            className="text-xs w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-950/20"
                            icon="i-lucide-trash-2"
                          >
                            学習内容をリセット
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {rawOcrResponse && !isEditingZones && (
                <Button
                  onClick={handleImportToParty}
                  variant="primary"
                  icon="i-lucide-arrow-right"
                  className="w-full"
                >
                  選択したポケモンを一括インポート
                </Button>
              )}
            </div>
          </div>

          {/* Debug raw text log display panel */}
          {rawOcrResponse && !isEditingZones && (
            <div className="card-premium space-y-3">
              <h3 className="font-bold border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                <span className="i-lucide-eye text-indigo-500" />
                OCR 検出テキストログ (デバッグ)
              </h3>
              <div className="max-h-[150px] overflow-y-auto bg-slate-100 dark:bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1">
                {rawOcrResponse.results.map((item, idx) => (
                  <div key={idx} className="flex justify-between hover:bg-slate-200 dark:hover:bg-slate-800 p-0.5 rounded">
                    <span>{idx + 1}. "{item.text}"</span>
                    <span className="text-slate-400">座標: x:{item.x}, y:{item.y}, w:{item.w}, h:{item.h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Panels: Splitted Grouped Slots Form */}
          {ocrData.length > 0 && !isEditingZones && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
                自動認識された各スロットデータ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ocrData.map((slot, slotIdx) => (
                  <div
                    key={`slot-${slotIdx}`}
                    className={`card-premium relative transition-all duration-200 flex flex-col justify-between ${
                      importSelected[slotIdx]
                        ? 'border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-950/5'
                        : 'opacity-60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Slot Header */}
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                        <span className="font-bold text-sm text-indigo-500">
                          スロット {slotIdx + 1}
                        </span>
                        <Checkbox
                          id={`import-${slotIdx}`}
                          label="インポート対象"
                          checked={importSelected[slotIdx]}
                          onChange={(e) => handleToggleImportSelected(slotIdx, e.target.checked)}
                        />
                      </div>

                      {/* Pokemon name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">ポケモン名</label>
                        <Autocomplete
                          value={slot.pokemonName}
                          onChange={(val) => updateSlotField(slotIdx, 'pokemonName', val)}
                          suggestions={selectPokemonNames}
                          placeholder="ピカチュウ"
                          className={fallbackWarning(slot.pokemonName)}
                          disabled={!importSelected[slotIdx]}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Ability */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">特性</label>
                          <Autocomplete
                            value={slot.ability}
                            onChange={(val) => updateSlotField(slotIdx, 'ability', val)}
                            suggestions={abilityList}
                            placeholder="特性"
                            className={fallbackWarning(slot.ability)}
                            disabled={!importSelected[slotIdx]}
                          />
                        </div>

                        {/* Item */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">持ち物</label>
                          <Autocomplete
                            value={slot.item}
                            onChange={(val) => updateSlotField(slotIdx, 'item', val)}
                            suggestions={selectItemNames}
                            placeholder="持ち物"
                            className={fallbackWarning(slot.item)}
                            disabled={!importSelected[slotIdx]}
                          />
                        </div>
                      </div>

                      {/* Moves */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">技構成</label>
                        <div className="grid grid-cols-2 gap-2">
                          {slot.moves.map((move, moveIdx) => (
                            <Autocomplete
                              key={`slot-${slotIdx}-move-${moveIdx}`}
                              value={move}
                              onChange={(val) => updateSlotMove(slotIdx, moveIdx, val)}
                              suggestions={selectMoveNames}
                              placeholder={`技 ${moveIdx + 1}`}
                              className={fallbackWarning(move)}
                              disabled={!importSelected[slotIdx]}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">実数値</label>
                        <div className="grid grid-cols-6 gap-1">
                          {(['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const).map((stat) => (
                            <div key={stat} className="text-center space-y-0.5">
                              <span className="text-[9px] text-slate-400 font-bold block">
                                {stat === 'hp' ? 'H' :
                                 stat === 'attack' ? 'A' :
                                 stat === 'defense' ? 'B' :
                                 stat === 'spAttack' ? 'C' :
                                 stat === 'spDefense' ? 'D' : 'S'}
                              </span>
                              <Input
                                type="number"
                                value={slot.stats[stat]?.toString() || ''}
                                onChange={(e) => updateSlotStat(slotIdx, stat, e.target.value)}
                                placeholder="0"
                                className={`text-center text-xs font-semibold px-0.5 py-1 ${
                                  slot.stats[stat] === null ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
                                }`}
                                disabled={!importSelected[slotIdx]}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
