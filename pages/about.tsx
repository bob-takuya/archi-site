import Head from 'next/head';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>このサイトについて | 日本の建築マップ</title>
        <meta name="description" content="日本の建築マップについての情報" />
      </Head>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">このサイトについて</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">プロジェクトの目的</h2>
          <p className="mb-4">
            「日本の建築マップ」は、建築学生や建築愛好家のために、日本の有名建築物を地図上で探索できるサイトです。
            建築物の基本情報だけでなく、関連する書籍や動画などのレファレンス、訪問記録なども提供し、
            建築学習のための総合的な情報ポータルを目指しています。
          </p>
          <p className="mb-4">
            このプロジェクトは非営利で運営されており、すべてのコンテンツはオープンソースとして
            <a
              href="https://github.com/username/archi-site"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHubリポジトリ
            </a>
            で公開されています。
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">データソース</h2>
          <p className="mb-4">
            当サイトの建築物データは以下のソースを参考にしています：
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <a
                href="http://help.architecturemap.net/"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                建築マップ
              </a>
              の追加建築一覧
            </li>
            <li>各建築家の公式サイト</li>
            <li>建築関連の書籍や雑誌</li>
            <li>建築学校のアーカイブ</li>
          </ul>
          <p>
            情報の正確性には最大限の注意を払っていますが、誤りがある場合はGitHubリポジトリのIssueにてご報告ください。
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">コンテンツの追加・修正について</h2>
          <p className="mb-4">
            このサイトは継続的に更新・改善を行っています。新しい建築物の追加や情報の修正は、
            GitHubリポジトリを通じて行うことができます。
          </p>
          <p className="mb-4">
            コントリビューションの方法：
          </p>
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>GitHubリポジトリをフォークする</li>
            <li>変更を加える（新しい建築物の追加や既存情報の修正）</li>
            <li>プルリクエストを送信する</li>
          </ol>
          <p>
            また、情報提供や修正依頼は、GitHubのIssueを通じて行うこともできます。
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">技術スタック</h2>
          <p className="mb-4">
            このサイトは以下の技術を使用して構築されています：
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Next.js - Reactフレームワーク</li>
            <li>TypeScript - 型安全なJavaScript</li>
            <li>Tailwind CSS - スタイリング</li>
            <li>Leaflet - インタラクティブマップ</li>
            <li>GitHub Pages - ホスティング</li>
          </ul>
        </div>
      </main>
    </>
  );
}
