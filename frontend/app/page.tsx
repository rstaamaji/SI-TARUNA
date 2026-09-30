import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-taruna-surface border border-taruna-border shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-taruna-yellow-500 to-taruna-yellow-600 flex items-center justify-center shadow-md ring-4 ring-taruna-red-100">
          <span className="text-white font-black text-2xl tracking-wider">ST</span>
        </div>
        <h1 className="text-3xl font-extrabold text-taruna-dark tracking-tight">
          SI-TARUNA
        </h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          Sistem Informasi Karang Taruna
        </p>
        <div className="mt-6 pt-6 border-t border-taruna-border">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-taruna-yellow-100 text-taruna-yellow-800">
            Karang Taruna Springin - Jumantono
          </span>
        </div>
      </div>
    </main>
  );
}
