# 日本の建築マップ (Architecture Map of Japan)

日本の有名建築物を地図上で探索できるウェブサイトです。建築学生や建築愛好家のための情報ポータルとして、建築家や建築年などの基本情報、関連するレファレンス（書籍や動画）、訪問記録などを提供しています。

## 機能

- 地図上で建築物を探索
- 建築家や年代でフィルタリング
- 各建築物の詳細情報の閲覧
- 関連する参考資料（書籍、記事、動画など）へのリンク
- 訪問記録やSNS投稿の表示

## 技術スタック

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Leaflet](https://leafletjs.com/) - インタラクティブマップ
- [GitHub Pages](https://pages.github.com/) - ホスティング

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/username/archi-site.git
cd archi-site

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## ビルドと公開

```bash
# 本番用ビルド
npm run build

# 静的ファイルの生成
npm run export

# GitHub Pagesへのデプロイ
# (GitHub Actionsを使用して自動化されています)
```

## コントリビューション

このプロジェクトは継続的に更新・改善を行っています。新しい建築物の追加や情報の修正は、GitHubリポジトリを通じて行うことができます。

コントリビューションの方法：
1. GitHubリポジトリをフォークする
2. 変更を加える（新しい建築物の追加や既存情報の修正）
3. プルリクエストを送信する

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## データソース

当サイトの建築物データは以下のソースを参考にしています：
- [建築マップ](http://help.architecturemap.net/)の追加建築一覧
- 各建築家の公式サイト
- 建築関連の書籍や雑誌
- 建築学校のアーカイブ
