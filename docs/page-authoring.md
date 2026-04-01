# Policy Page Authoring

このプロジェクトでは、政策ページの追加方法を 2 系統に分けて運用します。

## 1. テンプレートから新規作成する場合

対象:
- 記事型の説明ページ
- 軽い図表や比較カード中心のページ
- サイト共通の見た目で統一したいページ

手順:
1. `slug` を決めて `policies/<slug>/index.html` を作る。
2. `templates/policy-page-template.html` をコピーする。
3. `{{ROOT_PREFIX}}` を `../../` に、`{{ASSET_PREFIX}}` を `../../` に置き換える。
4. タイトル、説明、リード文、各セクションのプレースホルダを埋める。
5. [index.html](/Users/saotome2/develop/動画配信/政策解説シミュレータ/index.html) と [policies/index.html](/Users/saotome2/develop/動画配信/政策解説シミュレータ/policies/index.html) にカードを追加する。

## 2. 外部で生成した静的コードを取り込む場合

対象:
- 今回のように外部生成済みの完成HTMLがある
- Tailwind CDN や Chart.js CDN など、ページ独自の構成をそのまま残したい
- 共通CSSへ寄せるより、生成物の再利用性を優先したい

手順:
1. `slug` を決めて `policies/<slug>/index.html` を作る。
2. 外部生成HTMLをそのまま配置するか、`templates/external-static-template.html` に本文を差し込む。
3. 少なくとも次の導線を残す。
   - `../../index.html` へのリンク
   - `../index.html` へのリンク
   - 直リンク位置が分かる表記
4. [index.html](/Users/saotome2/develop/動画配信/政策解説シミュレータ/index.html) と [policies/index.html](/Users/saotome2/develop/動画配信/政策解説シミュレータ/policies/index.html) にカードを追加する。

## 運用ルール

- 個別ページの保存先は必ず `policies/<slug>/index.html` に統一する。
- ハブから辿れることと、個別ページ単体で完結することを両立する。
- 外部生成コードを取り込む場合でも、上部か下部にハブ導線を置く。
- 相対リンクは `../../index.html` と `../index.html` を基準に確認する。
- 追加後は少なくとも `/`、`/policies/`、`/policies/<slug>/` の 3 経路を確認する。
