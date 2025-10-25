import { Header } from './components/Header';
import { ConversionForm } from './components/ConversionForm';
import { ServerConversions } from './components/ServerConversions';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8">
          <ConversionForm />
          <ServerConversions />
        </div>
      </main>
    </div>
  );
}

export default App;
