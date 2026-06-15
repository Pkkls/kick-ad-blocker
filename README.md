# Kick Ad Blocker

Lightweight browser extension that blocks ads on [Kick.com](https://kick.com). Works on Chrome, Brave, Edge and Firefox.

---

🇺🇸 [English](#english) · 🇪🇸 [Español](#español) · 🇧🇷 [Português (BR)](#português-br) · 🇯🇵 [日本語](#日本語)

---

## English

Kick serves ads via Google Publisher Tags (GPT) and Google IMA SDK. This extension neutralizes both at the network and script level, so pre-roll and overlay ads never play.

### Install

#### Chrome, Brave, or Edge — easiest method (no build required)

The `dist/` folder in this repo is the ready-to-load extension. You don't need to install Node.js or run any commands.

**Step 1 — Download the repo**

Click the green **Code** button on this page → **Download ZIP** → unzip it anywhere on your computer.

**Step 2 — Open the extensions page**

- Chrome: paste `chrome://extensions` in your address bar and press Enter
- Brave: paste `brave://extensions`
- Edge: paste `edge://extensions`

**Step 3 — Enable Developer mode**

In the top-right corner of the extensions page, toggle **Developer mode** ON. A new toolbar will appear.

**Step 4 — Load the extension**

Click **Load unpacked** → navigate to the folder you unzipped → open the `dist` folder inside it → click **Select Folder**.

That's it. A green shield icon will appear in your toolbar. Open any Kick stream — ads are blocked.

> **Important:** always select the `dist` folder, not the root folder of the repo. The root folder contains source code and has no `manifest.json` — Chrome will show an error if you load it.

#### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate into the unzipped folder → open `dist` → select `manifest.json`
4. Open any Kick stream — ads are blocked

> Note: Firefox temporary add-ons are removed when the browser closes. A permanent install requires the extension to be signed by Mozilla.

### Build from source

```bash
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build        # Chrome / Brave / Edge
# npm run build:firefox  # Firefox
```

The built extension is in `dist/`. Load it as described above.

### How it works

**Layer 1 — Network blocking (`declarativeNetRequest`):** Static rules block requests to ad-serving domains before they reach the page (Google GPT, IMA SDK, DoubleClick, and more).

**Layer 2 — Script stubs (MAIN world):** Fake `window.googletag` and `window.google.ima` objects are injected at `document_start` and frozen — real ad scripts cannot overwrite them.

**Layer 3 — DOM cleanup (`MutationObserver`):** Ad containers and iframes are hidden instantly as they appear.

### Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save settings and stats |
| `alarms` | Keep service worker alive |
| `declarativeNetRequest` | Block ad domains at the network level |
| Host: `kick.com` | Inject content script on Kick pages |

### License

[MIT](LICENSE)

---

## Español

Kick muestra anuncios a través de Google Publisher Tags (GPT) y Google IMA SDK. Esta extensión los neutraliza a nivel de red y de script, para que los anuncios pre-roll y superpuestos nunca se reproduzcan.

### Instalación

#### Chrome, Brave o Edge — método más fácil (sin compilación)

La carpeta `dist/` de este repositorio ya es la extensión lista para cargar. No necesitas instalar Node.js ni ejecutar ningún comando.

**Paso 1 — Descarga el repositorio**

Haz clic en el botón verde **Code** en esta página → **Download ZIP** → descomprime el archivo en cualquier lugar de tu computadora.

**Paso 2 — Abre la página de extensiones**

- Chrome: escribe `chrome://extensions` en la barra de direcciones y presiona Enter
- Brave: escribe `brave://extensions`
- Edge: escribe `edge://extensions`

**Paso 3 — Activa el modo desarrollador**

En la esquina superior derecha de la página de extensiones, activa **Modo de desarrollador**. Aparecerá una nueva barra de herramientas.

**Paso 4 — Carga la extensión**

Haz clic en **Cargar descomprimida** → navega hasta la carpeta que descomprimiste → abre la carpeta `dist` que está dentro → haz clic en **Seleccionar carpeta**.

Listo. Aparecerá un icono de escudo verde en tu barra de herramientas. Abre cualquier stream de Kick — los anuncios están bloqueados.

> **Importante:** selecciona siempre la carpeta `dist`, no la carpeta raíz del repositorio. La carpeta raíz contiene código fuente y no tiene `manifest.json` — Chrome mostrará un error si la cargas.

#### Firefox

1. Ve a `about:debugging#/runtime/this-firefox`
2. Haz clic en **Cargar complemento temporal**
3. Navega hasta la carpeta descomprimida → abre `dist` → selecciona `manifest.json`
4. Abre cualquier stream de Kick — los anuncios están bloqueados

> Nota: los complementos temporales de Firefox se eliminan al cerrar el navegador. Una instalación permanente requiere que la extensión esté firmada por Mozilla.

---

## Português (BR)

O Kick exibe anúncios via Google Publisher Tags (GPT) e Google IMA SDK. Esta extensão neutraliza os dois no nível de rede e de script, para que anúncios pre-roll e sobrepostos nunca sejam reproduzidos.

### Instalação

#### Chrome, Brave ou Edge — método mais fácil (sem compilação)

A pasta `dist/` deste repositório já é a extensão pronta para carregar. Você não precisa instalar o Node.js nem executar nenhum comando.

**Passo 1 — Baixe o repositório**

Clique no botão verde **Code** nesta página → **Download ZIP** → descompacte o arquivo em qualquer lugar do seu computador.

**Passo 2 — Abra a página de extensões**

- Chrome: cole `chrome://extensions` na barra de endereços e pressione Enter
- Brave: cole `brave://extensions`
- Edge: cole `edge://extensions`

**Passo 3 — Ative o modo de desenvolvedor**

No canto superior direito da página de extensões, ative o **Modo do desenvolvedor**. Uma nova barra de ferramentas aparecerá.

**Passo 4 — Carregue a extensão**

Clique em **Carregar sem compactação** → navegue até a pasta que você descompactou → abra a pasta `dist` dentro dela → clique em **Selecionar pasta**.

Pronto. Um ícone de escudo verde aparecerá na sua barra de ferramentas. Abra qualquer stream do Kick — os anúncios estão bloqueados.

> **Importante:** sempre selecione a pasta `dist`, não a pasta raiz do repositório. A pasta raiz contém código-fonte e não tem `manifest.json` — o Chrome mostrará um erro se você carregá-la.

#### Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em **Carregar extensão temporária**
3. Navegue até a pasta descompactada → abra `dist` → selecione `manifest.json`
4. Abra qualquer stream do Kick — os anúncios estão bloqueados

> Nota: extensões temporárias do Firefox são removidas quando o navegador é fechado. Uma instalação permanente requer que a extensão seja assinada pela Mozilla.

---

## 日本語

Kickは Google Publisher Tags（GPT）および Google IMA SDK を通じて広告を配信しています。この拡張機能はネットワークレベルとスクリプトレベルの両方で広告を無効化するため、プリロール広告やオーバーレイ広告が再生されることはありません。

### インストール方法

#### Chrome、Brave、または Edge — 最も簡単な方法（ビルド不要）

このリポジトリの `dist/` フォルダはすでに読み込み可能な拡張機能です。Node.js のインストールやコマンドの実行は一切不要です。

**ステップ 1 — リポジトリをダウンロードする**

このページの緑色の **Code** ボタンをクリック → **Download ZIP** → ダウンロードしたファイルをパソコンの好きな場所に解凍してください。

**ステップ 2 — 拡張機能ページを開く**

- Chrome: アドレスバーに `chrome://extensions` と入力してEnterを押す
- Brave: `brave://extensions`
- Edge: `edge://extensions`

**ステップ 3 — デベロッパーモードを有効にする**

拡張機能ページの右上にある **デベロッパーモード** のトグルをONにしてください。新しいツールバーが表示されます。

**ステップ 4 — 拡張機能を読み込む**

**パッケージ化されていない拡張機能を読み込む** をクリック → 解凍したフォルダに移動 → その中の `dist` フォルダを開く → **フォルダを選択** をクリック。

以上です。ツールバーに緑色のシールドアイコンが表示されます。Kick の任意のストリームを開いてください — 広告はブロックされています。

> **重要:** 必ず `dist` フォルダを選択してください。リポジトリのルートフォルダは選択しないでください。ルートフォルダにはソースコードが含まれており `manifest.json` がないため、Chrome はエラーを表示します。

#### Firefox

1. `about:debugging#/runtime/this-firefox` にアクセス
2. **一時的なアドオンを読み込む** をクリック
3. 解凍したフォルダに移動 → `dist` を開く → `manifest.json` を選択
4. Kick の任意のストリームを開く — 広告はブロックされています

> 注意: Firefox の一時的なアドオンはブラウザを閉じると削除されます。永続的なインストールには Mozilla による署名が必要です。
