import React, { useEffect, useState } from 'react';
import { Difficulty, Operation } from '../types';
import { Divide, X, Plus, Minus, Play, Sparkles, Grid3X3 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface Props {
  onStart: (op: Operation, diff: Difficulty, table: number | null) => void;
}

const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [selectedOp, setSelectedOp] = useState<Operation>('multiplication');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>(Difficulty.MEDIUM);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
        audioService.playIntroMusic();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
      audioService.playDing();
      onStart(selectedOp, selectedDiff, selectedTable);
  };

  const isTableOperation = selectedOp === 'multiplication' || selectedOp === 'division';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4 animate-fadeIn relative z-10">
      
      {/* Logo Area */}
      <div className="relative group cursor-default animate-float">
        <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur opacity-60 animate-pulse"></div>
        <div className="relative bg-white rounded-full p-4 md:p-6 border-8 border-yellow-400 shadow-2xl">
           <span className="text-5xl md:text-6xl filter drop-shadow-lg">💰</span>
        </div>
      </div>
      
      <div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-500 mb-2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
          الوليد المليونير
        </h1>
        <p className="text-yellow-200 text-lg md:text-2xl font-bold drop-shadow-md">
          جدول الضرب والقسمة للأذكياء
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl rounded-3xl p-6 border-2 border-yellow-500/50 shadow-2xl relative overflow-hidden">
        
        {/* Operation Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-3 bg-indigo-900/50 inline-block px-4 py-1 rounded-full border border-indigo-400">اختر نوع المسابقة</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
                { id: 'multiplication', icon: X, label: 'ضرب', color: 'bg-red-500' },
                { id: 'division', icon: Divide, label: 'قسمة', color: 'bg-blue-500' },
                { id: 'addition', icon: Plus, label: 'جمع', color: 'bg-green-500' },
                { id: 'subtraction', icon: Minus, label: 'طرح', color: 'bg-orange-500' }
            ].map((op) => (
                <button 
                  key={op.id}
                  onClick={() => {
                      setSelectedOp(op.id as Operation);
                      setSelectedTable(null); // Reset table selection when changing Op
                      audioService.playDing();
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 transform ${selectedOp === op.id ? `${op.color} scale-105 shadow-lg border-2 border-white` : 'bg-indigo-900/60 hover:bg-indigo-800'}`}
                >
                  <op.icon size={28} className="text-white mb-1" strokeWidth={3} /> 
                  <span className="font-bold text-md">{op.label}</span>
                </button>
            ))}
          </div>
        </div>

        {/* Table Selection (Only for Mult/Div) */}
        {isTableOperation && (
            <div className="mb-6 animate-zoomInUp">
                <h3 className="text-lg font-bold text-white mb-3 bg-indigo-900/50 inline-block px-4 py-1 rounded-full border border-indigo-400">
                    {selectedOp === 'multiplication' ? 'أي جدول تريد؟' : 'القسمة على رقم؟'}
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                    {/* Numbers 2 to 9 */}
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => { setSelectedTable(num); audioService.playDing(); }}
                            className={`py-3 rounded-xl font-black text-xl transition-all ${selectedTable === num ? 'bg-yellow-400 text-indigo-900 scale-110 ring-2 ring-white' : 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700'}`}
                        >
                            {num}
                        </button>
                    ))}
                    {/* Mixed Option */}
                    <button
                        onClick={() => { setSelectedTable(null); audioService.playDing(); }}
                        className={`col-span-4 md:col-span-1 py-3 rounded-xl font-bold text-md transition-all flex items-center justify-center gap-1 ${selectedTable === null ? 'bg-purple-500 text-white ring-2 ring-white' : 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700'}`}
                    >
                        <Grid3X3 size={16} />
                        كوكتيل
                    </button>
                </div>
            </div>
        )}

        {/* Difficulty (Only if not mixing tables, or for Add/Sub) */}
        {!isTableOperation && (
            <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-3 bg-indigo-900/50 inline-block px-4 py-1 rounded-full border border-indigo-400">مستوى الصعوبة</h3>
            <div className="flex justify-between gap-3 bg-indigo-950/40 p-2 rounded-2xl">
                {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((diff) => (
                <button
                    key={diff}
                    onClick={() => { setSelectedDiff(diff); audioService.playDing(); }}
                    className={`flex-1 py-2 rounded-xl text-md font-bold transition-all ${selectedDiff === diff ? 'bg-yellow-400 text-indigo-900 shadow-lg' : 'text-indigo-300 hover:bg-white/10'}`}
                >
                    {diff}
                </button>
                ))}
            </div>
            </div>
        )}

        <button 
          onClick={handleStart}
          className="w-full bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-black text-2xl py-4 rounded-2xl shadow-[0_6px_0_rgb(21,128,61)] active:shadow-[0_3px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-3 group border-t-2 border-green-300 mt-4"
        >
          <span>ابدأ التحدي</span>
          <Play className="group-hover:translate-x-1 transition-transform fill-current" size={28} />
        </button>

      </div>
    </div>
  );
};

export default StartScreen;