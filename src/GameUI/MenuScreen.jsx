import React, { useState } from 'react';

const VolumeSlider = ({ label, value, onChange }) => (
	<div className="w-full">
		<div className="flex justify-between items-center mb-2">
			<span className="text-neutral-400 text-xs pixel-font">{label}</span>
			<span className="text-neutral-500 text-xs pixel-font">
				{Math.round(value * 100)}%
			</span>
		</div>
		<div className="relative w-full h-6 flex items-center group">
			<div className="absolute w-full h-2 bg-neutral-900 rounded-full border border-neutral-800/30" />
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={value}
				onChange={(e) => onChange(parseFloat(e.target.value))}
				className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
			/>
			<div
				className="absolute h-2 bg-gradient-to-r from-neutral-700 to-neutral-600 rounded-full pointer-events-none"
				style={{ width: `${value * 100}%` }}
			/>
			<div
				className="absolute w-3 h-3 bg-neutral-400 rounded-full border border-neutral-600 pointer-events-none transition-transform group-hover:scale-110"
				style={{ left: `calc(${value * 100}% - 0.375rem)` }}
			/>
		</div>
	</div>
);

const MenuScreen = ({ onStartGame, visible }) => {
	const [sfxVolume, setSfxVolume] = useState(0.7);
	const [musicVolume, setMusicVolume] = useState(0.5);

	if (!visible) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
			{/* Dark atmospheric gradient overlay */}
			<div className="absolute inset-0 bg-gradient-radial from-neutral-950 via-neutral-900 to-neutral-950 opacity-90" />

			<div className="relative flex flex-col items-center space-y-8 p-8 rounded-lg border-2 border-neutral-800/30 bg-gradient-to-b from-neutral-950/90 to-neutral-900/90 backdrop-blur-sm">
				<div className="text-center space-y-2">
					<h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 to-neutral-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pixel-font uppercase [letter-spacing:0.2em] transform scale-y-125">
						Dark
						<br />
						Mayhem
					</h1>
					<p className="text-neutral-500 text-base pixel-font tracking-wide pt-4">
						Into the Endless Night
					</p>
				</div>

				<div className="flex flex-col space-y-3 w-72">
					<button
						onClick={onStartGame}
						className="group relative py-3 px-8 rounded bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 transition-all duration-300 border border-neutral-700/20 shadow-lg shadow-black/50"
					>
						<span className="absolute inset-0 bg-neutral-400/5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						<span className="relative text-lg text-neutral-400 pixel-font tracking-widest group-hover:text-neutral-200 transition-colors duration-300">
							BEGIN
						</span>
					</button>

					{/* Volume Controls Section */}
					<div className="bg-neutral-950/50 p-3 rounded border border-neutral-800/30 space-y-3">
						<VolumeSlider
							label="Sound FX"
							value={sfxVolume}
							onChange={setSfxVolume}
						/>
						<VolumeSlider
							label="Music"
							value={musicVolume}
							onChange={setMusicVolume}
						/>
					</div>
				</div>

				<div className="text-white font-bold text-xs pixel-font tracking-wide">
					Work In Progress
				</div>
			</div>
		</div>
	);
};

export default MenuScreen;
