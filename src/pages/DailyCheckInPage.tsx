import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId, getProfileData } from '@/services/storage';
import { todayISO, nowISO } from '@/utils/helpers';
import { DailyCheckInForm, type CheckInFormValues } from '@/components/DailyCheckInForm';
import { TodayCheckInSummary } from '@/components/HomeCheckInSection';
import type { DailyCheckIn } from '@/types';
import { getTodayCheckIn } from '@/utils/symptoms';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

function buildCheckIn(values: CheckInFormValues, profileId: string): DailyCheckIn {
  const now = nowISO();
  return {
    id: generateId(),
    profileId,
    date: todayISO(),
    checkInTime: now,
    noSymptomsReported: values.noSymptomsReported,
    symptomsSinceLastCheckIn: !values.noSymptomsReported,
    selectedIssues: values.selectedIssueIds,
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
  const { activeProfile, data, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  const profileData = getProfileData(data, activeProfile.id);
  const today = todayISO();
  const todayCheckIn = getTodayCheckIn(profileData.dailyCheckIns, today);
  const activeIssues = profileData.issues
    .filter((i) => i.active)
    .map((i) => ({ id: i.id, name: i.name }));
  const issueName = (issueId: string) =>
    profileData.issues.find((i) => i.id === issueId)?.name;

  if (todayCheckIn) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-800">Daily Check-In</h1>
        <TodayCheckInSummary checkIn={todayCheckIn} issueName={issueName} />
        <Card className="space-y-3 py-4 text-center">
          <p className="text-xs text-slate-500">
            One check-in per day keeps your baseline clear. If something new happens, log a
            symptom instead.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/add/symptom">
              <Button size="sm">Log symptom</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="sm">
                Back to home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Daily Check-In</h1>
      <DailyCheckInForm
        activeIssues={activeIssues}
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
