import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { DoodleTape, DoodlePaperPlane } from '../components/doodle/DoodleAssets';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-notebook-grid flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Decorative plane */}
      <div className="absolute top-12 right-12 hidden md:block">
        <DoodlePaperPlane className="w-16 h-16 text-blue-600 animate-pulse" />
      </div>

      <div className="max-w-md w-full bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0px_#0f172a] p-8 space-y-4 relative">
        <DoodleTape variant="red" className="-top-3.5 left-1/2 -translate-x-1/2" />

        <div className="w-14 h-14 rounded-md bg-red-100 border-2 border-slate-900 flex items-center justify-center font-bold text-red-600 shadow-[2px_2px_0px_#0f172a] mx-auto mb-2">
          <Store className="w-7 h-7" />
        </div>

        <h1 className="text-8xl font-marker text-red-600 drop-shadow-[4px_4px_0px_#0f172a] tracking-wider leading-none">
          404
        </h1>

        <h2 className="text-2xl font-heading font-bold text-slate-900">
          Yeh Page Nahi Mila
        </h2>

        <p className="text-sm font-sans text-slate-600">
          Looks like this page was doodled away or misplaced in the ledger notebook!
        </p>

        <div className="pt-2">
          <Link to="/app">
            <Button variant="primary" size="md" className="font-heading font-bold shadow-doodle w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
