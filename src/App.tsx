import { Route, Switch } from 'wouter';
import { LandingView } from './components/LandingView';
import { AppShell } from './components/AppShell';
import { useSession } from './lib/auth';

export default function App() {
  const { session } = useSession();

  return (
    <Switch>
      <Route path="/app" component={AppShell} />
      <Route path="/">
        <LandingView hasSession={!!session} />
      </Route>
      <Route>
        <LandingView hasSession={!!session} />
      </Route>
    </Switch>
  );
}
