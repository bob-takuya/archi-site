import Head from 'next/head';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <>
      <Head>
        <title>日本の建築マップ | Architecture Map of Japan</title>
        <meta name="description" content="日本の有名建築物を地図上で探索できるサイト" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`min-h-screen p-8 ${inter.className}`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">日本の建築マップ</h1>
          <p className="text-lg mb-8 text-center">
            日本の有名建築物を地図上で探索できるサイトです。建築学生や建築愛好家のための情報ポータルとして、
            建築家や建築年などの基本情報、関連するレファレンス（書籍や動画）、訪問記録などを提供しています。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">地図から探す</h2>
              <p className="mb-4">
                日本全国の有名建築物を地図上から探索できます。
                地域ごとにフィルタリングして、訪問計画を立てるのに役立ちます。
              </p>
              <Link href="/map" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                地図を見る
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">一覧から探す</h2>
              <p className="mb-4">
                建築家や年代、建築様式などから建築物を検索できます。
                詳細な情報と関連資料へのリンクを提供しています。
              </p>
              <Link href="/buildings" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                一覧を見る
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-12">
            <h2 className="text-2xl font-semibold mb-4">最近追加された建築物</h2>
            <ul className="space-y-2">
              <li className="p-2 hover:bg-gray-100 rounded">
                <Link href="/buildings/tokyo-international-forum" className="block">
                  東京国際フォーラム（東京都） - 建築家: ラファエル・ヴィニオリ
                </Link>
              </li>
              <li className="p-2 hover:bg-gray-100 rounded">
                <Link href="/buildings/sumida-hokusai-museum" className="block">
                  すみだ北斎美術館（東京都） - 建築家: 妹島和世
                </Link>
              </li>
              <li className="p-2 hover:bg-gray-100 rounded">
                <Link href="/buildings/toyoito-museum" className="block">
                  TOTOギャラリー・間（東京都） - 建築家: 伊東豊雄
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              このサイトは建築学生のための非営利プロジェクトです。情報の追加や修正のご要望は
              <a href="https://github.com/username/archi-site" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                GitHubリポジトリ
              </a>
              にお寄せください。
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
