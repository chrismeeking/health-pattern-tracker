import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <Card className="space-y-4 py-8 text-center">
        <p className="text-sm text-slate-500">{description}</p>
        <Link to="/add">
          <Button variant="outline" size="sm">
            Back to Quick Add
          </Button>
        </Link>
      </Card>
    </div>
  );
}
