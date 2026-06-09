import { useEffect, useState } from 'react';
import type { MeasurementSystem } from '@/types';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToStonePounds,
  MEASUREMENT_SYSTEM_LABELS,
  stonePoundsToKg,
} from '@/utils/measurements';

interface BodyMetricsFieldsProps {
  system: MeasurementSystem;
  onSystemChange: (system: MeasurementSystem) => void;
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  onHeightChange: (cm: number | undefined) => void;
  onCurrentWeightChange: (kg: number | undefined) => void;
  onTargetWeightChange: (kg: number | undefined) => void;
  showTarget?: boolean;
  inputClass: string;
}

export function BodyMetricsFields({
  system,
  onSystemChange,
  heightCm,
  currentWeightKg,
  targetWeightKg,
  onHeightChange,
  onCurrentWeightChange,
  onTargetWeightChange,
  showTarget = true,
  inputClass,
}: BodyMetricsFieldsProps) {
  const [heightCmInput, setHeightCmInput] = useState(heightCm?.toString() ?? '');
  const [currentKgInput, setCurrentKgInput] = useState(currentWeightKg?.toString() ?? '');
  const [targetKgInput, setTargetKgInput] = useState(targetWeightKg?.toString() ?? '');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [currentSt, setCurrentSt] = useState('');
  const [currentLb, setCurrentLb] = useState('');
  const [targetSt, setTargetSt] = useState('');
  const [targetLb, setTargetLb] = useState('');

  useEffect(() => {
    if (system === 'metric') {
      setHeightCmInput(heightCm != null ? String(heightCm) : '');
      setCurrentKgInput(currentWeightKg != null ? String(currentWeightKg) : '');
      setTargetKgInput(targetWeightKg != null ? String(targetWeightKg) : '');
      return;
    }
    if (heightCm != null) {
      const { feet, inches } = cmToFeetInches(heightCm);
      setHeightFt(String(feet));
      setHeightIn(String(inches));
    } else {
      setHeightFt('');
      setHeightIn('');
    }
    if (currentWeightKg != null) {
      const { stone, pounds } = kgToStonePounds(currentWeightKg);
      setCurrentSt(String(stone));
      setCurrentLb(String(pounds));
    } else {
      setCurrentSt('');
      setCurrentLb('');
    }
    if (targetWeightKg != null) {
      const { stone, pounds } = kgToStonePounds(targetWeightKg);
      setTargetSt(String(stone));
      setTargetLb(String(pounds));
    } else {
      setTargetSt('');
      setTargetLb('');
    }
  }, [system, heightCm, currentWeightKg, targetWeightKg]);

  const parseMetric = (value: string): number | undefined => {
    if (value.trim() === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1 dark:text-slate-400">Units</label>
        <select
          value={system}
          onChange={(e) => onSystemChange(e.target.value as MeasurementSystem)}
          className={inputClass}
        >
          {(Object.keys(MEASUREMENT_SYSTEM_LABELS) as MeasurementSystem[]).map((key) => (
            <option key={key} value={key}>
              {MEASUREMENT_SYSTEM_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {system === 'metric' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                value={heightCmInput}
                onChange={(e) => {
                  setHeightCmInput(e.target.value);
                  onHeightChange(parseMetric(e.target.value));
                }}
                placeholder="e.g. 165"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Current weight (kg)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={currentKgInput}
                onChange={(e) => {
                  setCurrentKgInput(e.target.value);
                  onCurrentWeightChange(parseMetric(e.target.value));
                }}
                placeholder="e.g. 68"
                className={inputClass}
              />
            </div>
          </div>
          {showTarget && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Target weight (kg)</label>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={targetKgInput}
                onChange={(e) => {
                  setTargetKgInput(e.target.value);
                  onTargetWeightChange(parseMetric(e.target.value));
                }}
                placeholder="e.g. 65"
                className={inputClass}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Height</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={heightFt}
                onChange={(e) => {
                  setHeightFt(e.target.value);
                  const ft = Number(e.target.value);
                  const inches = Number(heightIn) || 0;
                  if (e.target.value === '' && heightIn === '') {
                    onHeightChange(undefined);
                  } else if (Number.isFinite(ft)) {
                    const cm = feetInchesToCm(ft, inches);
                    onHeightChange(Number.isFinite(cm) ? Math.round(cm) : undefined);
                  }
                }}
                placeholder="ft"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={heightIn}
                onChange={(e) => {
                  setHeightIn(e.target.value);
                  const ft = Number(heightFt) || 0;
                  const inches = Number(e.target.value);
                  if (heightFt === '' && e.target.value === '') {
                    onHeightChange(undefined);
                  } else if (Number.isFinite(inches)) {
                    const cm = feetInchesToCm(ft, inches);
                    onHeightChange(Number.isFinite(cm) ? Math.round(cm) : undefined);
                  }
                }}
                placeholder="in"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Current weight (st / lb)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={currentSt}
                onChange={(e) => {
                  setCurrentSt(e.target.value);
                  const st = Number(e.target.value) || 0;
                  const lb = Number(currentLb) || 0;
                  if (e.target.value === '' && currentLb === '') {
                    onCurrentWeightChange(undefined);
                  } else {
                    const kg = stonePoundsToKg(st, lb);
                    onCurrentWeightChange(Number.isFinite(kg) ? Math.round(kg * 10) / 10 : undefined);
                  }
                }}
                placeholder="st"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={currentLb}
                onChange={(e) => {
                  setCurrentLb(e.target.value);
                  const st = Number(currentSt) || 0;
                  const lb = Number(e.target.value) || 0;
                  if (currentSt === '' && e.target.value === '') {
                    onCurrentWeightChange(undefined);
                  } else {
                    const kg = stonePoundsToKg(st, lb);
                    onCurrentWeightChange(Number.isFinite(kg) ? Math.round(kg * 10) / 10 : undefined);
                  }
                }}
                placeholder="lb"
                className={inputClass}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Or enter lb only in the lb field (e.g. 150 lb)</p>
          </div>
          {showTarget && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Target weight (st / lb)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={targetSt}
                  onChange={(e) => {
                    setTargetSt(e.target.value);
                    const st = Number(e.target.value) || 0;
                    const lb = Number(targetLb) || 0;
                    if (e.target.value === '' && targetLb === '') {
                      onTargetWeightChange(undefined);
                    } else {
                      const kg = stonePoundsToKg(st, lb);
                      onTargetWeightChange(Number.isFinite(kg) ? Math.round(kg * 10) / 10 : undefined);
                    }
                  }}
                  placeholder="st"
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  inputMode="decimal"
                  value={targetLb}
                  onChange={(e) => {
                    setTargetLb(e.target.value);
                    const st = Number(targetSt) || 0;
                    const lb = Number(e.target.value) || 0;
                    if (targetSt === '' && e.target.value === '') {
                      onTargetWeightChange(undefined);
                    } else {
                      const kg = stonePoundsToKg(st, lb);
                      onTargetWeightChange(Number.isFinite(kg) ? Math.round(kg * 10) / 10 : undefined);
                    }
                  }}
                  placeholder="lb"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Single weight input for log-weight page — converts to kg on save. */
export function WeightInputField({
  system,
  kgValue,
  onKgChange,
  inputClass,
}: {
  system: MeasurementSystem;
  kgValue?: number;
  onKgChange: (kg: number | undefined) => void;
  inputClass: string;
}) {
  const [kgInput, setKgInput] = useState(kgValue?.toString() ?? '');
  const [st, setSt] = useState('');
  const [lb, setLb] = useState('');

  useEffect(() => {
    if (system === 'metric') {
      setKgInput(kgValue != null ? String(kgValue) : '');
      return;
    }
    if (kgValue != null) {
      const parts = kgToStonePounds(kgValue);
      setSt(String(parts.stone));
      setLb(String(parts.pounds));
    } else {
      setSt('');
      setLb('');
    }
  }, [system, kgValue]);

  if (system === 'metric') {
    return (
      <div>
        <label className="block text-sm text-slate-600 mb-1">Weight (kg)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={kgInput}
          onChange={(e) => {
            setKgInput(e.target.value);
            const n = Number(e.target.value);
            onKgChange(e.target.value === '' || !Number.isFinite(n) || n <= 0 ? undefined : n);
          }}
          className={inputClass}
          placeholder="e.g. 72.5"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">Weight (st / lb)</label>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={0}
          value={st}
          onChange={(e) => {
            setSt(e.target.value);
            const stone = Number(e.target.value) || 0;
            const pounds = Number(lb) || 0;
            const kg = stonePoundsToKg(stone, pounds);
            onKgChange(Number.isFinite(kg) ? Math.round(kg * 10) / 10 : undefined);
          }}
          placeholder="st"
          className={inputClass}
        />
        <input
          type="number"
          min={0}
          step="0.1"
          value={lb}
          onChange={(e) => {
            setLb(e.target.value);
            const stone = Number(st) || 0;
            const pounds = Number(e.target.value) || 0;
            const kg = stonePoundsToKg(stone, pounds);
            onKgChange(Number.isFinite(kg) ? Math.round(kg * 10) / 10 : undefined);
          }}
          placeholder="lb"
          className={inputClass}
        />
      </div>
    </div>
  );
}
