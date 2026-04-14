import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';
import { authService } from '@/services/authService';
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const [email, setEmail] = useState('abc@gmail.com');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiResponse(null);
    try {
      // Only call loginUser (Redux thunk), do not call authService.login directly
      const result = await dispatch(loginUser({ email, password })).unwrap();
      setApiResponse(result);
      navigate('/');
    } catch (error: any) {
      setApiResponse(error.response ? error.response.data : { success: false, message: error.message });
    }
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10" // Adds padding so text doesn't overlap the icon
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 select-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" /> // Custom "hide" icon
                ) : (
                  <Eye className="h-4 w-4" />    // Custom "show" icon
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium">Demo credentials:</p>
          <p>Email: abc@gmail.com</p>
          <p>Password: 123</p>
        </div>
        {apiResponse && (
          <div className="mt-4 p-2 rounded bg-muted text-xs">
            <div>API Response:</div>
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
