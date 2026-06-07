import type { SymptomEpisode } from '@/types';
import { PAIN_LOCATION_LABELS } from '@/types';
import { formatDate, formatTime } from '@/utils/helpers';
import { formatSymptomSummary } from '@/utils/symptoms';
import { Card } from './Card';

interface SymptomEpisodeCardProps {
  episode: SymptomEpisode;
  issueName?: string;
}

export function SymptomEpisodeCard({ episode, issueName }: SymptomEpisodeCardProps) {
  return (
    <Card className="space-y-1">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-medium text-slate-800 capitalize">{formatSymptomSummary(episode)}</p>
          <p className="text-xs text-slate-400">
            {formatDate(episode.startDateTime)} · {formatTime(episode.startDateTime)}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${
            episode.severity === 'severe'
              ? 'bg-coral-100 text-coral-600'
              : episode.severity === 'moderate'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sage-100 text-sage-700'
          }`}
        >
          {episode.severity}
        </span>
      </div>
      {issueName && <p className="text-xs text-slate-500">Issue: {issueName}</p>}
      {episode.painLocation && (
        <p className="text-xs text-slate-500">
          Location: {PAIN_LOCATION_LABELS[episode.painLocation]}
        </p>
      )}
      {episode.suspectedTrigger && (
        <p className="text-xs text-slate-400">Suspected: {episode.suspectedTrigger}</p>
      )}
    </Card>
  );
}
