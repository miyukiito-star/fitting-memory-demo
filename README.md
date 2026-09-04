# FITTING MEMORY

UNITED ARROWS green label relaxing向けの商談デモ用LIFFモックです。「試着を、その場だけの体験にしない。」をコンセプトに、未購入の試着商品を、そのときの丈感・サイズ感・着心地・自由メモとともに残します。

## 起動

Node.js 20.19+ または22.12+を用意します。

```bash
npm install
npm run dev
```

本番ビルドは `npm run build`、確認は `npm run preview` です。

## LIFF

`.env.example` を `.env.local` にコピーして設定します。

```env
VITE_LIFF_ID=YOUR_LIFF_ID
```

未設定時やLIFF初期化失敗時も通常のWebアプリとして動作します。

## 主要フロー

`START → タグ読取 → 商品確認 → MY FITTINGへ追加 → 試着メモ → MY FITTING → 比較／お気に入り`。右上の `DEMO` から、最初からやり直す、履歴削除、退店後の再訪状態を体験できます。履歴とメモはlocalStorageに保存されます。

カメラは `navigator.mediaDevices.getUserMedia` を使用します。スマートフォンではHTTPSまたはlocalhostで開き、カメラ利用を許可してください。権限拒否時もデモ継続ボタンから先へ進めます。

## モックとしての制約

商品認識、店舗在庫、会員、EC、CRM、購入処理は疑似データで、APIやバックエンドには接続していません。商品情報は2026年9月時点の公式サイトおよび正規流通の商品掲載を参照し、画像はデモ中の安定表示のためローカル保存しています。恒久利用・公開時は権利者の利用許諾を確認してください。

## GitHub Pages

Viteのbaseは `/fitting-memory-demo/` に設定済みです。`main` へのpushでGitHub Actionsが `npm ci → npm run build → distをPagesへdeploy` します。リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択してください。

公開URL: `https://miyukiito-star.github.io/fitting-memory-demo/`
