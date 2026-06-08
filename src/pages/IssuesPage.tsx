import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { getProfileData, removeById } from '@/services/storage';
import { IssueCard } from '@/components/IssueCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function IssuesPage() {
  const { data, activeProfile, update } = useApp();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!activeProfile) return null;

  const issues = getProfileData(data, activeProfile.id).issues.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const issueToDelete = deleteId ? issues.find((i) => i.id === deleteId) : null;

  const confirmDelete = () => {
    if (!deleteId) return;
    update((d) => ({ ...d, issues: removeById(d.issues, deleteId) }));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">Health Issues</h1>
        <Link to="/add/issue">
          <Button size="sm">+ New</Button>
        </Link>
      </div>

      <Card className="bg-teal-50 border-teal-100 space-y-2">
        <p className="text-sm text-teal-800 leading-relaxed">
          Track what you want to understand. Link symptoms and meals to build a picture over time.
        </p>
        <Link to="/patterns/timeline" className="text-xs text-teal-600 font-medium">
          View meal–symptom timeline →
        </Link>
      </Card>

      {issues.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-6">
            No issues yet. Create one to start investigating patterns.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onDelete={() => setDeleteId(issue.id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete issue?"
        message={
          issueToDelete
            ? `"${issueToDelete.name}" and its links will be removed. Symptom logs will remain.`
            : 'This issue will be removed permanently.'
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
