import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="p-6 max-w-md mx-auto pt-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Sobre EspaOil</h1>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 text-gray-600">
        <p>
          EspaOil es una aplicación diseñada para ayudarte a ahorrar en cada repostaje.
        </p>
        <p>
          Utilizamos datos del Ministerio para la Transición Ecológica y el Reto Demográfico. Se actualiza cada 2 horas.
        </p>
        <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-sm">Versión 1.0.0</p>
        </div>
      </div>
    </div>
  );
};