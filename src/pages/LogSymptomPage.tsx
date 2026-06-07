import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { generateId } from '@/services/storage';
import { getMealsInLastHours } from '@/utils/symptoms';
import { nowISO } from '@/utils/helpers';
import { SymptomForm, type SymptomFormValues } from '@/components/SymptomForm';
import type { SymptomEpisode } from '@/types';

function buildEpisode(
  values: SymptomFormValues,
  profileId: string
): SymptomEpisode {
  const now = nowISO();
  return {
    id: generateId(),
    profileId,
    issueId: values.issueId,
    startDateTime: now,
    severity: values.severity,
    painScore: values.painScore,
    symptoms: values.symptoms,
    bloating: values.bloating || undefined,
    nausea: values.nausea || undefined,
    sweating: values.sweating || undefined,
    vomiting: values.vomiting || undefined,
    fever: values.fever || undefined,
    burping: values.burping || undefined,
    passingWind: values.passingWind || undefined,
    bowelMovement: values.bowelMovement || undefined,
    diarrhoea: values.diarrhoea || undefined,
    constipation: values.constipation || undefined,
    sleepAffected: values.sleepAffected || undefined,
    painLocation: values.painLocation,
    painDescription: values.painDescription,
    suspectedTrigger: values.suspectedTrigger.trim() || undefined,
    relatedMealIds: values.relatedMealIds.length > 0 ? values.relatedMealIds : undefined,
    notes: values.notes.trim() || undefined,
    createdAt: now,
  };
}

export function LogSymptomPage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  const issueOptions = data.issues
    .filter((i) => i.profileId === activeProfile.id && i.active)
    .map((i) => ({ id: i.id, name: i.name }));

  const recentMeals = getMealsInLastHours(
    data.meals.filter((m) => m.profileId === activeProfile.id),
    12
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Log Symptom</h1>
      <SymptomForm
        issueOptions={issueOptions}
        recentMeals={recentMeals}
        onSubmit={(values) => {
          const episode = buildEpisode(values, activeProfile.id);
          update((d) => ({
            ...d,
            symptomEpisodes: [...d.symptomEpisodes, episode],
          }));
          navigate('/');
        }}
        onCancel={() => navigate('/add')}
      />
    </div>
  );
}
