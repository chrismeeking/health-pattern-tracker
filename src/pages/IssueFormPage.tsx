import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { findById, generateId, updateById } from '@/services/storage';
import { nowISO } from '@/utils/helpers';
import { IssueForm, issueToFormValues, type IssueFormValues } from '@/components/IssueForm';
import type { HealthIssue } from '@/types';

function buildIssue(
  values: IssueFormValues,
  profileId: string,
  existing?: HealthIssue
): HealthIssue {
  const now = nowISO();
  return {
    id: existing?.id ?? generateId(),
    profileId,
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    category: values.category,
    possibleTriggers: values.possibleTriggers,
    active: values.active,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function CreateIssuePage() {
  const { activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Create Issue</h1>
      <IssueForm
        onSubmit={(values) => {
          const issue = buildIssue(values, activeProfile.id);
          update((d) => ({ ...d, issues: [...d.issues, issue] }));
          navigate('/issues');
        }}
        onCancel={() => navigate('/add')}
      />
    </div>
  );
}

export function EditIssuePage() {
  const { id } = useParams<{ id: string }>();
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();

  if (!activeProfile || !id) return null;

  const issue = findById(
    data.issues.filter((i) => i.profileId === activeProfile.id),
    id
  );

  if (!issue) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-slate-500">Issue not found.</p>
        <Link to="/issues" className="text-teal-500 text-sm">
          Back to issues
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Edit Issue</h1>
      <IssueForm
        initial={issueToFormValues(issue)}
        submitLabel="Save changes"
        onSubmit={(values) => {
          const updated = buildIssue(values, activeProfile.id, issue);
          update((d) => ({
            ...d,
            issues: updateById(d.issues, issue.id, updated),
          }));
          navigate('/issues');
        }}
        onCancel={() => navigate('/issues')}
      />
    </div>
  );
}
