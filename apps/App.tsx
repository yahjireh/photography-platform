import React, { useState } from 'react';
import Launcher from './pages/Launcher';
import ClientApp from './components/ClientApp';
import PhotographerApp from './components/PhotographerApp';
import Layout from './components/Layout';

const App = () => {
  const [activeApp, setActiveApp] = useState<'launcher' | 'client' | 'photographer'>('launcher');

  if (activeApp === 'launcher') {
      return (
          <Layout fullScreen={true}>
            <Launcher onLaunch={(app) => setActiveApp(app)} />
          </Layout>
      );
  }

  if (activeApp === 'client') {
      return <ClientApp onExit={() => setActiveApp('launcher')} />;
  }

  if (activeApp === 'photographer') {
      return <PhotographerApp onExit={() => setActiveApp('launcher')} />;
  }

  return null;
}

export default App;