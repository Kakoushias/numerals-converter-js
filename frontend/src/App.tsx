import { Header } from './components/Header';
import { ConversionForm } from './components/ConversionForm';
import { ServerConversions } from './components/ServerConversions';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-sky-800 to-slate-700">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="section-hero">
              <div className="container py-12 lg:py-24 text-center mx-auto">
                  <h1 className="text-white text-4xl xl:text-5xl font-bold pb-2">
                      The World’s #1 Arabic <span className="text-amber-400">↔</span> Roman Numeral Converter
                  </h1>
                  <p className="mt-1 text-base lg:text-lg xl:text-xl text-gray-100 text-center">
                      Because history deserves precision — and a modern UI.
                  </p>
              </div>
          </section>
        <div className="grid grid-cols-1 gap-8">
          <ConversionForm />
          <ServerConversions />
        </div>
      </main>
    </div>
  );
}

export default App;
