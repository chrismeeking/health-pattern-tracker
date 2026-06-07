import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import { todayISO, nowISO } from '@/utils/helpers';
import { DailyCheckInForm, type CheckInFormValues } from '@/components/DailyCheckInForm';
import type { DailyCheckIn } from '@/types';

function buildCheckIn(values: CheckInFormValues, profileId: string): DailyCheckIn {
  const now = nowISO();
  return {
    id: generateId(),
    profileId,
    date: todayISO(),
    checkInTime: now,
    noSymptomsReported: values.noSymptomsReported,
    symptomsSinceLastCheckIn: !values.noSymptomsReported,
    selectedIssues: [],
    mildBloatingPressure: values.mildBloatingPressure || undefined,
    indigestion: values.indigestion || undefined,
    painEpisode: values.painEpisode || undefined,
    gas: values.gas || undefined,
    nausea: values.nausea || undefined,
    sweating: values.sweating || undefined,
    vomiting: values.vomiting || undefined,
    fever: values.fever || undefined,
    diarrhoea: values.diarrhoea || undefined,
    constipation: values.constipation || undefined,
    headache: values.headache || undefined,
    tiredness: values.tiredness || undefined,
    skinIssue: values.skinIssue || undefined,
    sleepAffected: values.sleepAffected || undefined,
    stressLevel: values.noSymptomsReported ? undefined : values.stressLevel,
    energyLevel: values.noSymptomsReported ? undefined : values.energyLevel,
    notes: values.notes.trim() || undefined,
    createdAt: now,
  };
}

export function DailyCheckInPage() {
  const { activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Daily Check-In</h1>
      <DailyCheckInForm
        onSubmit={(values) => {
          const checkIn = buildCheckIn(values, activeProfile.id);
          update((d) => ({
            ...d,
            dailyCheckIns: [...d.dailyCheckIns, checkIn],
          }));
          navigate('/');
        }}
        onCancel={() => navigate('/add')}
      />
    </div>
  );
}
