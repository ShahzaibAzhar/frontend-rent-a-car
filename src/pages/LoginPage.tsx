import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser, selectAuthLoading, selectAuthError } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const [email, setEmail] = useState('admin@fleet.com');
  const [password, setPassword] = useState('password');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Car className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-card-foreground">FleetManager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@fleet.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter any password" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium">Demo credentials:</p>
          <p>Admin: admin@fleet.com</p>
          <p>Staff: staff@fleet.com</p>
          <p className="mt-1 italic">Any password works</p>
        </div>
      </div>
    </div>
  );
}
