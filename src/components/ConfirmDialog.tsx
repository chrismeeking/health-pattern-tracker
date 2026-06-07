import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  warning,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto">
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          {warning && (
            <p className="text-sm text-coral-700 bg-coral-50 rounded-xl px-3 py-2 leading-relaxed">
              {warning}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
