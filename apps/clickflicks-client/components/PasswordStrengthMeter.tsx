import React from 'react';
import { Icons } from './ui/icons';

export interface PasswordAnalysis {
  score: number; // 0 to 4
  label: string;
  color: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isValid: boolean;
}

export function analyzePassword(password: string): PasswordAnalysis {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  let score = 0;
  if (hasLength) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let label = 'Weak';
  let color = 'bg-red-500 text-red-400';

  if (score === 0 || score === 1) {
    label = 'Weak';
    color = 'bg-red-500 text-red-400';
  } else if (score === 2) {
    label = 'Medium';
    color = 'bg-amber-400 text-amber-300';
  } else if (score === 3) {
    label = 'Strong';
    color = 'bg-emerald-400 text-emerald-300';
  } else if (score === 4) {
    label = 'Master-Grade';
    color = 'bg-brand-DEFAULT text-brand-light';
  }

  return {
    score,
    label,
    color,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    isValid: hasLength && score >= 2
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  showCriteria = true 
}) => {
  if (!password) return null;

  const analysis = analyzePassword(password);

  return (
    <div className="space-y-2.5 pt-1">
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 grid grid-cols-4 gap-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${
                analysis.score >= step
                  ? analysis.score === 1
                    ? 'bg-red-500'
                    : analysis.score === 2
                    ? 'bg-amber-400'
                    : analysis.score === 3
                    ? 'bg-emerald-400'
                    : 'bg-brand-DEFAULT'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider ${analysis.color.split(' ')[1]}`}>
          {analysis.label}
        </span>
      </div>

      {/* Criteria Checklist */}
      {showCriteria && (
        <div className="grid grid-cols-2 gap-1 text-[9px] font-medium text-gray-300 pt-1">
          <div className="flex items-center space-x-1.5">
            {analysis.hasLength ? (
              <Icons.Check size={11} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
            )}
            <span className={analysis.hasLength ? 'text-gray-200' : 'text-gray-400'}>8+ Characters</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {analysis.hasUpper && analysis.hasLower ? (
              <Icons.Check size={11} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
            )}
            <span className={analysis.hasUpper && analysis.hasLower ? 'text-gray-200' : 'text-gray-400'}>Upper & Lower Case</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {analysis.hasNumber ? (
              <Icons.Check size={11} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
            )}
            <span className={analysis.hasNumber ? 'text-gray-200' : 'text-gray-400'}>At Least 1 Number</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {analysis.hasSpecial ? (
              <Icons.Check size={11} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0" />
            )}
            <span className={analysis.hasSpecial ? 'text-gray-200' : 'text-gray-400'}>Special Character</span>
          </div>
        </div>
      )}
    </div>
  );
};
