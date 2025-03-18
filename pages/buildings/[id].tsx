import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buildingsData } from '@/data/buildings';
import { Building } from '@/types/building';
import dynamic from 'next/dynamic';

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-60 bg-gray-100 flex items-center justify-center">地図を読み込み中...</div>,
});

export default function BuildingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [building, setBuilding] = useState<Building | null>(null);

  useEffect(() => {
    if (id) {
      const foundBuilding = buildingsData.find((b) => b.id === id);
      if (foundBuilding) {
        setBuilding(foundBuilding);
      } else {
        router.push('/buildings');
      }
    }
  }, [id, router]);

  if (!building) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{building.name} | 日本の建築マップ</title>
        <meta name="description" content={`${building.name}の詳細情報 - 建築家: ${building.architect}, 建築年: ${building.year}`} />
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/buildings" className="text-blue-600 hover:underline">
            ← 建築物一覧に戻る
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="text-3xl font-bold mb-2">{building.name}</h1>
          <div className="flex flex-wrap text-sm text-gray-600 mb-6">
            <div className="mr-6 mb-2">
              <span className="font-medium">建築家:</span> {building.architect}
            </div>
            <div className="mr-6 mb-2">
              <span className="font-medium">建築年:</span> {building.year}年
            </div>
            <div className="mb-2">
              <span className="font-medium">場所:</span> {building.prefecture}
              {building.city}
              {building.address && ` (${building.address})`}
            </div>
          </div>

          {building.images && building.images.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {building.images.map((image, index) => (
                  <div key={index} className="bg-gray-100 h-64 flex items-center justify-center">
                    <p className="text-gray-500">画像: {image}</p>
                    {/* 実際の画像が用意できたら以下のようにimgタグで表示 */}
                    {/* <img src={image} alt={`${building.name} - 画像${index + 1}`} className="w-full h-full object-cover" /> */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {building.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">概要</h2>
              <p className="text-gray-700 leading-relaxed">{building.description}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">地図</h2>
            <div className="h-60 bg-gray-100 mb-2">
              <MapComponent buildings={[building]} />
            </div>
            <p className="text-sm text-gray-500">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${building.latitude},${building.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Mapsで見る
              </a>
            </p>
          </div>
        </div>

        {building.references && building.references.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">参考資料</h2>
            <ul className="divide-y divide-gray-200">
              {building.references.map((reference) => (
                <li key={reference.id} className="py-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-gray-900">{reference.title}</h3>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap text-sm text-gray-500">
                        {reference.type && (
                          <div className="mr-4">
                            <span className="font-medium">種類:</span>{' '}
                            {reference.type === 'book'
                              ? '書籍'
                              : reference.type === 'article'
                              ? '記事'
                              : reference.type === 'video'
                              ? '動画'
                              : 'ウェブサイト'}
                          </div>
                        )}
                        {reference.author && (
                          <div className="mr-4">
                            <span className="font-medium">著者:</span> {reference.author}
                          </div>
                        )}
                        {reference.publisher && (
                          <div className="mr-4">
                            <span className="font-medium">出版:</span> {reference.publisher}
                          </div>
                        )}
                        {reference.year && (
                          <div>
                            <span className="font-medium">年:</span> {reference.year}
                          </div>
                        )}
                      </div>
                      {reference.description && (
                        <p className="mt-2 text-sm text-gray-600">{reference.description}</p>
                      )}
                    </div>
                    {reference.url && (
                      <div className="mt-2 md:mt-0 md:ml-4">
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          リンク
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {building.visits && building.visits.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">訪問記録</h2>
            <ul className="divide-y divide-gray-200">
              {building.visits.map((visit) => (
                <li key={visit.id} className="py-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-gray-900">{visit.title}</h3>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap text-sm text-gray-500">
                        <div className="mr-4">
                          <span className="font-medium">著者:</span> {visit.author}
                        </div>
                        {visit.date && (
                          <div className="mr-4">
                            <span className="font-medium">日付:</span> {visit.date}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">ソース:</span>{' '}
                          {visit.source === 'note'
                            ? 'note'
                            : visit.source === 'blog'
                            ? 'ブログ'
                            : 'その他'}
                        </div>
                      </div>
                      {visit.excerpt && (
                        <p className="mt-2 text-sm text-gray-600">{visit.excerpt}</p>
                      )}
                    </div>
                    <div className="mt-2 md:mt-0 md:ml-4">
                      <a
                        href={visit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        記事を読む
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {building.socialMedia && building.socialMedia.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">SNSでの投稿</h2>
            <ul className="divide-y divide-gray-200">
              {building.socialMedia.map((social) => (
                <li key={social.id} className="py-4">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">
                          {social.platform === 'twitter'
                            ? 'Twitter'
                            : social.platform === 'instagram'
                            ? 'Instagram'
                            : social.platform === 'facebook'
                            ? 'Facebook'
                            : 'その他'}
                        </span>
                        {social.author && <span className="text-gray-600">{social.author}</span>}
                        {social.date && (
                          <span className="text-gray-500 text-sm ml-2">({social.date})</span>
                        )}
                      </div>
                      {social.content && (
                        <p className="mt-2 text-sm text-gray-600">{social.content}</p>
                      )}
                    </div>
                    <div className="mt-2 md:mt-0 md:ml-4">
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        投稿を見る
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
