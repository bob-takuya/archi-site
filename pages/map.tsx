import Head from 'next/head';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { buildingsData } from '@/data/buildings';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-70vh flex items-center justify-center bg-gray-100">地図を読み込み中...</div>,
});

export default function MapPage() {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('all');
  const [filteredBuildings, setFilteredBuildings] = useState(buildingsData);

  // Filter buildings when prefecture selection changes
  useEffect(() => {
    if (selectedPrefecture === 'all') {
      setFilteredBuildings(buildingsData);
    } else {
      setFilteredBuildings(
        buildingsData.filter((building) => building.prefecture === selectedPrefecture)
      );
    }
  }, [selectedPrefecture]);

  // Get unique prefectures for the filter dropdown
  const prefectures = ['all', ...new Set(buildingsData.map((building) => building.prefecture))].sort();

  return (
    <>
      <Head>
        <title>地図から探す | 日本の建築マップ</title>
        <meta name="description" content="日本の有名建築物を地図上で探索できます" />
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">地図から建築物を探す</h1>
        
        <div className="mb-6">
          <label htmlFor="prefecture-filter" className="block mb-2 font-medium">
            都道府県でフィルタリング:
          </label>
          <select
            id="prefecture-filter"
            value={selectedPrefecture}
            onChange={(e) => setSelectedPrefecture(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full max-w-xs"
          >
            {prefectures.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture === 'all' ? 'すべての都道府県' : prefecture}
              </option>
            ))}
          </select>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <MapComponent buildings={filteredBuildings} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedPrefecture === 'all'
              ? 'すべての建築物'
              : `${selectedPrefecture}の建築物`}{' '}
            ({filteredBuildings.length}件)
          </h2>
          
          {filteredBuildings.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredBuildings.map((building) => (
                <li key={building.id} className="py-4">
                  <a
                    href={`/buildings/${building.id}`}
                    className="block hover:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    <h3 className="text-lg font-medium text-gray-900">{building.name}</h3>
                    <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap text-sm text-gray-500">
                      <div className="mr-4">
                        <span className="font-medium">建築家:</span> {building.architect}
                      </div>
                      <div className="mr-4">
                        <span className="font-medium">建築年:</span> {building.year}
                      </div>
                      <div>
                        <span className="font-medium">場所:</span> {building.prefecture}
                        {building.city}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">該当する建築物がありません。</p>
          )}
        </div>
      </main>
    </>
  );
}
