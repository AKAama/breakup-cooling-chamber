import { AppRoutes } from './core/router';
import { LockOverlay } from './features/lock/LockOverlay';
import { useAppStore } from './core/store';

function App() {
  const isLocked = useAppStore((s) => s.isLocked);

  return (
    <>
      <AppRoutes />
      {isLocked && <LockOverlay />}
    </>
  );
}

export default App;
