import { Link } from 'react-router-dom';
import { Button } from './Button';

interface EntityActionsProps {
  editTo?: string;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function EntityActions({
  editTo,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
}: EntityActionsProps) {
  return (
    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
      {editTo && (
        <Link to={editTo} className="flex-1">
          <Button variant="outline" size="sm" fullWidth>
            {editLabel}
          </Button>
        </Link>
      )}
      {onDelete && (
        <Button variant="ghost" size="sm" className="text-coral-500" onClick={onDelete}>
          {deleteLabel}
        </Button>
      )}
    </div>
  );
}
