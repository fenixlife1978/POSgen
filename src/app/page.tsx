
import React from 'react';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-6 text-center">
      <div className="size-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 mb-8 animate-bounce">
        <Sparkles className="size-10 text-white" />
      </div>
      <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
        Workstation <span className="text-blue-600">Limpia</span>
      </h1>
      <p className="text-xl text-slate-500 max-w-lg mx-auto font-medium">
        Todo el código anterior ha sido eliminado. Estoy listo para empezar tu nuevo proyecto. ¿Qué tienes en mente?
      </p>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-2">Paso 1</h3>
          <p className="text-sm text-slate-400">Describe tu nueva idea o el tipo de aplicación que quieres crear.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-2">Paso 2</h3>
          <p className="text-sm text-slate-400">Diseñaré la estructura base y los componentes necesarios.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-2">Paso 3</h3>
          <p className="text-sm text-slate-400">Construiremos la funcionalidad paso a paso.</p>
        </div>
      </div>
    </div>
  );
}
