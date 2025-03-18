import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { buildingsData } from '@/data/buildings';

export default function BuildingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArchitect, setFilterArchitect] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState(buildingsData);

  // Get unique architects and years for filter dropdowns
  const architects = ['', ...Array.from(new Set(buildingsData.map((building) => building.architect)))].sort();
  const years = ['', ...Array.from(new Set(buildingsData.map((building) => building.year.toString())))].sort((a, b) => b.localeCompare(a));

  // Filter buildings when search term or filters change
  useEffect(() => {
    let result = buildingsData;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (building) =>
          building.name.toLowerCase().includes(lowerSearchTerm) ||
          building.architect.toLowerCase().includes(lowerSearchTerm) ||
          building.prefecture.toLowerCase().includes(lowerSearchTerm) ||
          building.city.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (filterArchitect) {
      result = result.filter((building) => building.architect === filterArchitect);
    }

    if (filterYear) {
      result = result.filter((building) => building.year.toString() === filterYear);
    }

    setFilteredBuildings(result);
  }, [searchTerm, filterArchitect, filterYear]);

  return (
    <>
      <Head>
        <title>建築物一覧 | 日本の建築マップ</title>
        <meta name="description" content="日本の有名建築物の一覧" />
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">建築物一覧</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="search" className="block mb-2 font-medium">
                検索:
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="建築物名、建築家、場所など"
                className="p-2 border border-gray-300 rounded w-full"
              />
            </div>
            <div>
              <label htmlFor="architect-filter" className="block mb-2 font-medium">
                建築家:
              </label>
              <select
                id="architect-filter"
                value={filterArchitect}
                onChange={(e) => setFilterArchitect(e.target.value)}
                className="p-2 border border-gray-300 rounded w-full"
              >
                <option value="">すべての建築家</option>
                {architects.filter(a => a).map((architect) => (
                  <option key={architect} value={architect}>
                    {architect}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year-filter" className="block mb-2 font-medium">
                建築年:
              </label>
              <select
                id="year-filter"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="p-2 border border-gray-300 rounded w-full"
              >
                <option value="">すべての年代</option>
                {years.filter(y => y).map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mb-4 text-gray-600">
            {filteredBuildings.length}件の建築物が見つかりました
          </p>

          {filteredBuildings.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredBuildings.map((building) => (
                <li key={building.id} className="py-4">
                  <Link href={`/buildings/${building.id}`} className="block hover:bg-gray-50 transition duration-150 ease-in-out">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="flex-grow">
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
                        {building.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {building.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 md:mt-0 md:ml-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          詳細を見る
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">該当する建築物がありません。検索条件を変更してください。</p>
          )}
        </div>
      </main>
    </>
  );
}
