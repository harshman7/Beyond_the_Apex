import React from 'react';
import type { Driver } from '@/types';
import { getTeam } from '@/lib/data/dataUtils';

interface DriverCardProps {
  driver: Driver;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  driver,
  onClick,
  showDetails = false,
  className = '',
}) => {
  const team = getTeam(driver.teamId);

  return (
    <div
      onClick={onClick}
      className={`
        bg-card rounded-xl p-4 border border-border 
        hover:border-primary/50 transition-all cursor-pointer
        ${onClick ? 'hover:shadow-lg' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: team?.primaryColor || '#666' }}
        >
          {driver.carNumber}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{driver.name}</h3>
            {driver.rookie && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                ROOKIE
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{driver.code}</p>
          {team && (
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: team.primaryColor }}
              />
              <span className="text-xs text-muted-foreground">{team.name}</span>
            </div>
          )}
        </div>
        {showDetails && (
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{driver.points}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        )}
      </div>
    </div>
  );
};

