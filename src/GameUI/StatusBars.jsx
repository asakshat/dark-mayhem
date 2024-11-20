import React from 'react';

const StatusBar = ({ player, totalEnemiesKilled = 0 }) => {
	if (!player) return null;

	// Ensure we have valid numbers with fallbacks
	const health = Math.max(0, player.currentHealth || 0);
	const maxHealth = Math.max(1, player.maxHealth || 100);
	const xp = Math.max(0, player.xp || 0);
	const xpToNextLevel = Math.max(1, player.getXPToNextLevel?.() || 100);
	const level = Math.max(1, player.level || 1);

	// Calculate percentages safely
	const healthPercent = Math.min(100, Math.max(0, (health / maxHealth) * 100));
	const xpPercent = Math.min(100, Math.max(0, (xp / xpToNextLevel) * 100));

	return (
		<div className="fixed top-4 left-4 w-64 p-2 bg-neutral-950 border border-neutral-800/50 rounded-lg">
			<div className="bg-neutral-900 p-2 mb-2 rounded border border-neutral-800/30">
				<div className="flex justify-between items-center">
					<span className="text-orange-400 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						Monsters Slained
					</span>
					<span className="text-orange-300 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						{totalEnemiesKilled}
					</span>
				</div>
			</div>

			{/* Health Bar */}
			<div className="bg-neutral-900/80 p-2 mb-2 rounded border border-neutral-800/30">
				<div className="flex justify-between items-center mb-1">
					<span className="text-red-400 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						Vitality
					</span>
					<span className="text-red-300 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						{health}/{maxHealth}
					</span>
				</div>
				<div className="w-full h-4 bg-neutral-950 rounded overflow-hidden border border-neutral-800/20">
					<div
						className="h-full bg-gradient-to-r from-red-800 to-red-600"
						style={{
							width: `${healthPercent}%`,
							transition: 'width 300ms ease-out',
						}}
					/>
				</div>
			</div>

			{/* Level Counter */}
			<div className="bg-neutral-900/80 p-2 mb-2 rounded border border-neutral-800/30">
				<div className="flex justify-between items-center">
					<span className="text-yellow-400 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						Current Level
					</span>
					<span className="text-yellow-300 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						{level}
					</span>
				</div>
			</div>

			{/* XP Bar */}
			<div className="bg-neutral-900/80 p-2 rounded border border-neutral-800/30">
				<div className="flex justify-between items-center mb-1">
					<span className="text-purple-400 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						XP
					</span>
					<span className="text-purple-300 text-xs font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
						{xp}/{xpToNextLevel}
					</span>
				</div>
				<div className="w-full h-3 bg-neutral-950 rounded overflow-hidden border border-neutral-800/20">
					<div
						className="h-full bg-gradient-to-r from-purple-700 to-purple-500"
						style={{
							width: `${xpPercent}%`,
							transition: 'width 300ms ease-out',
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default StatusBar;
