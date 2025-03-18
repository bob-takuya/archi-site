import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Head from 'next/head';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={inter.className}>
        <header className="bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
            <Link href="/" className="text-2xl font-bold mb-4 md:mb-0">
              日本の建築マップ
            </Link>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/" className="hover:text-blue-600">
                    ホーム
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="hover:text-blue-600">
                    地図
                  </Link>
                </li>
                <li>
                  <Link href="/buildings" className="hover:text-blue-600">
                    建築物一覧
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-blue-600">
                    このサイトについて
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <Component {...pageProps} />
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">日本の建築マップ</h3>
                <p className="text-gray-300">
                  建築学生や建築愛好家のための情報ポータルサイト。
                  日本の有名建築物を地図上で探索し、詳細情報を提供しています。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">リンク</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/map" className="text-gray-300 hover:text-white">
                      地図から探す
                    </Link>
                  </li>
                  <li>
                    <Link href="/buildings" className="text-gray-300 hover:text-white">
                      建築物一覧
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-300 hover:text-white">
                      このサイトについて
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">お問い合わせ</h3>
                <p className="text-gray-300">
                  情報の追加や修正のご要望は
                  <a
                    href="https://github.com/username/archi-site"
                    className="text-blue-400 hover:underline ml-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHubリポジトリ
                  </a>
                  にお寄せください。
                </p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
              <p>© {new Date().getFullYear()} 日本の建築マップ. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
