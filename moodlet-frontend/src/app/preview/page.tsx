"use client";

import Link from "next/link";
import React, { useState, useRef } from 'react';
import { Coordinate, ImageFile } from './types';
import { generateInteriorScene } from './services/geminiService';

// Fix for "Cannot find namespace 'JSX'": Using React.ReactElement which is an equivalent and more explicit type.
const UploadPlaceholder: React.FC<{ icon: React.ReactElement; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 border-2 border-dashed border-gray-600 rounded-xl p-8 hover:bg-gray-800/50 transition-colors">
    {icon}
    <span className="mt-4 text-center">{text}</span>
  </div>
);

const ChangeImageButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-2 right-2 z-20 bg-black/60 hover:bg-purple-600 text-white p-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 border border-white/10 shadow-lg group"
    title="Change Image"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
    <span className="text-xs font-medium">Change</span>
  </button>
);

type RedesignMode = 'item' | 'text';

const App: React.FC = () => {
  const [baseImage, setBaseImage] = useState<ImageFile>(null);
  const [insertImage, setInsertImage] = useState<ImageFile>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<RedesignMode>('item');
  const [prompt, setPrompt] = useState<string>('');

  const baseImageInputRef = useRef<HTMLInputElement>(null);
  const insertImageInputRef = useRef<HTMLInputElement>(null);
  const baseImageRef = useRef<HTMLImageElement>(null);


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<ImageFile>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImage({ file, base64 });
      
      // Reset result and error when any image changes
      setResultImage(null);
      setError(null);

      // Specific reset for base image
      if (setImage === setBaseImage) {
        setCoordinates([]);
      }
    }
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!baseImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoordinates(prev => prev.length >= 4 ? [{x, y}] : [...prev, { x, y }]);
  };

  const handleReset = () => {
    setBaseImage(null);
    setInsertImage(null);
    setCoordinates([]);
    setResultImage(null);
    setError(null);
    setPrompt('');
    setMode('item');
  };
  
  const drawAreaAndGenerate = (
    baseImg: HTMLImageElement, // The original image object from new Image()
    displayedImgElement: HTMLImageElement, // The <img> element from the DOM
    coords: Coordinate[]
  ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = baseImg.naturalWidth;
        canvas.height = baseImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && coords.length === 4) {
            ctx.drawImage(baseImg, 0, 0);

            // Calculate scaling factors between the displayed image and the original image
            const scaleX = baseImg.naturalWidth / displayedImgElement.clientWidth;
            const scaleY = baseImg.naturalHeight / displayedImgElement.clientHeight;

            // Scale the coordinates
            const scaledCoords = coords.map(coord => ({
                x: coord.x * scaleX,
                y: coord.y * scaleY
            }));

            ctx.beginPath();
            ctx.moveTo(scaledCoords[0].x, scaledCoords[0].y);
            scaledCoords.slice(1).forEach(coord => {
                ctx.lineTo(coord.x, coord.y);
            });
            ctx.closePath();
            ctx.fillStyle = 'red';
            ctx.fill();
            resolve(canvas.toDataURL('image/jpeg'));
        } else {
            reject(new Error("Four coordinates must be selected."));
        }
      });
  }

  const handleGenerate = async () => {
    const isReady = baseImage && coordinates.length === 4 && (mode === 'item' ? insertImage : prompt.trim() !== '');
    if (!isReady) {
      setError("Please upload a room photo, select 4 points, and provide an item or a description.");
      return;
    }
    if (!baseImageRef.current) {
        setError("Base image element is not available for processing.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    const displayedImageElement = baseImageRef.current;
    const image = new Image();
    image.src = baseImage.base64;
    image.onload = async () => {
        try {
            const baseImageWithArea = await drawAreaAndGenerate(image, displayedImageElement, coordinates);
            const result = await generateInteriorScene(
                mode === 'item'
                    ? { baseImageWithMarkerBase64: baseImageWithArea, insertImage: insertImage! }
                    : { baseImageWithMarkerBase64: baseImageWithArea, prompt: prompt }
            );
            setResultImage(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    image.onerror = () => {
        setError("Could not load the base image for processing.");
        setIsLoading(false);
    }
  };
  
  const getInstructionText = () => {
      if (!baseImage) return null;
      const pointsNeeded = 4 - coordinates.length;
      if (pointsNeeded > 0) {
          return `Click ${pointsNeeded} more point${pointsNeeded > 1 ? 's' : ''} to define the area to replace.`;
      }
      return <span className="text-green-400 font-bold">Area selected! Ready to redesign.</span>;
  }

  const isGenerateDisabled = !baseImage || coordinates.length !== 4 || (mode === 'item' ? !insertImage : !prompt.trim()) || isLoading;

  const PhotoIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const PlusIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="text-center md:text-left">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Interior Redesigner AI
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                Visualize new furniture in your space.
                </p>
            </div>

            {/* ▶ 버튼 2개를 한 줄에 배치 */}
            <div className="flex items-center gap-3">
                {/* 메인으로 돌아가기 버튼 */}
                <Link
                href="/"
                className="px-4 py-2 bg-gray-800/70 hover:bg-gray-700 rounded-lg text-sm text-gray-300 border border-gray-700 hover:border-purple-500 transition-colors flex items-center gap-2"
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7 7-7"
                    />
                </svg>
                To Main
                </Link>

                {/* Start Over 버튼 */}
                {baseImage && (
                <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-2"
                >
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                    </svg>
                    Start Over
                </button>
                )}
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold flex items-center text-purple-300">
              <span className="bg-purple-600 text-white rounded-full h-8 w-8 text-lg flex items-center justify-center mr-3 shadow-lg">1</span>
              Your Room
            </h2>
            <div className="aspect-w-4 aspect-h-3 bg-gray-800 rounded-xl overflow-hidden cursor-crosshair relative group border-2 border-gray-700 hover:border-purple-500/50 transition-colors shadow-2xl" onClick={handleImageClick}>
              {baseImage ? (
                <div className="relative w-full h-full">
                  <img ref={baseImageRef} src={baseImage.base64} alt="Your Room" className="w-full h-full object-contain pointer-events-none" />
                  
                  {/* Change Image Button */}
                  <ChangeImageButton onClick={(e) => {
                      e.stopPropagation();
                      baseImageInputRef.current?.click();
                  }} />

                  {coordinates.map((coord, index) => (
                    <div
                      key={index}
                      className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-sm"
                      style={{ left: `${coord.x}px`, top: `${coord.y}px` }}
                    />
                  ))}
                  {coordinates.length > 1 && (
                     <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <polyline
                            points={coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.9)"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                        />
                        {coordinates.length === 4 && (
                            <polygon
                                points={coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="rgba(239, 68, 68, 0.3)"
                                stroke="rgb(239, 68, 68)"
                                strokeWidth="2"
                            />
                        )}
                     </svg>
                  )}
                </div>
              ) : (
                <button onClick={() => baseImageInputRef.current?.click()} className="w-full h-full">
                  <UploadPlaceholder icon={PhotoIcon} text="Click to upload a photo of your room" />
                </button>
              )}
            </div>
            <input type="file" accept="image/*" ref={baseImageInputRef} onChange={(e) => handleImageSelect(e, setBaseImage)} className="hidden" />
            <div className="text-gray-300 bg-gray-800/50 p-3 rounded-lg text-center h-12 flex items-center justify-center border border-gray-700">
                <p>{getInstructionText()}</p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold flex items-center text-pink-300">
              <span className="bg-pink-600 text-white rounded-full h-8 w-8 text-lg flex items-center justify-center mr-3 shadow-lg">2</span>
              New Item
            </h2>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800 rounded-lg border border-gray-700">
                <button onClick={() => setMode('item')} className={`w-full p-2 rounded-md font-semibold transition-all ${mode === 'item' ? 'bg-pink-600 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>
                    Upload Photo
                </button>
                <button onClick={() => setMode('text')} className={`w-full p-2 rounded-md font-semibold transition-all ${mode === 'text' ? 'bg-pink-600 text-white shadow-md' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>
                    Describe Text
                </button>
            </div>
            <div className="aspect-w-4 aspect-h-3 bg-gray-800 rounded-xl overflow-hidden flex flex-col relative border-2 border-gray-700 hover:border-pink-500/50 transition-colors shadow-2xl">
              {mode === 'item' ? (
                insertImage ? (
                  <div className="relative w-full h-full">
                     <img src={insertImage.base64} alt="Item to insert" className="w-full h-full object-contain" />
                     <ChangeImageButton onClick={(e) => {
                        e.stopPropagation();
                        insertImageInputRef.current?.click();
                     }} />
                  </div>
                ) : (
                  <button onClick={() => insertImageInputRef.current?.click()} className="w-full h-full">
                    <UploadPlaceholder icon={PlusIcon} text="Click to upload a photo of the furniture/item" />
                  </button>
                )
              ) : (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'A beige nordic style fabric sofa', 'Vintage wooden coffee table'"
                  className="w-full h-full bg-gray-800 text-white p-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-xl text-lg placeholder-gray-500"
                />
              )}
            </div>
             <input type="file" accept="image/*" ref={insertImageInputRef} onChange={(e) => handleImageSelect(e, setInsertImage)} className="hidden" />
            
             <button
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
              className="w-full py-4 text-lg font-bold rounded-xl transition-all duration-300 ease-in-out shadow-lg
                         bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/25
                         disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 disabled:shadow-none
                         transform hover:-translate-y-1"
            >
              {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Designing...
                  </span>
              ) : '✨ Generate Design'}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {(isLoading || resultImage || error) && (
            <div className="mt-12 border-t border-gray-700 pt-12">
                <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Transformation Result</h2>
                <div className="max-w-4xl mx-auto aspect-w-16 aspect-h-9 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-700 shadow-2xl relative">
                    {isLoading && (
                         <div className="flex flex-col items-center p-8 text-center animate-pulse">
                            <div className="h-16 w-16 bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                                <svg className="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-xl font-medium text-gray-300">Processing your room...</p>
                            <p className="text-sm text-gray-500 mt-2">Analyzing perspective and lighting</p>
                         </div>
                    )}
                    {error && (
                        <div className="text-center text-red-400 p-8 bg-red-900/20 rounded-xl mx-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
                            <p>{error}</p>
                        </div>
                    )}
                    {resultImage && (
                        <div className="relative w-full h-full group">
                            <img src={resultImage} alt="Generated interior design" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                {/* Overlay content if needed */}
                            </div>
                            <a 
                                href={resultImage} 
                                download="redesigned-room.jpg"
                                className="absolute bottom-6 right-6 bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2 transition-transform transform hover:scale-105 pointer-events-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Image
                            </a>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;