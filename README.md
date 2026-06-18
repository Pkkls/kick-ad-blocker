# Kick Ad Blocker

Lightweight browser extension that blocks ads on [Kick.com](https://kick.com). Works on Chrome, Brave, Edge and Firefox.

---

🇺🇸 [English](#english) · 🇪🇸 [Español](#español) · 🇧🇷 [Português (BR)](#português-br) · 🇯🇵 [日本語](#日本語)

---

## English

Kick serves its ads through Google Publisher Tags (GPT) and the Google IMA SDK. This extension neutralizes both — at the network level and at the script level — so pre-roll and overlay ads simply never play.

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

In the top-right corner of the extensions page, switch **Developer mode** ON. A new toolbar appears.

**Step 4 — Load the extension**

Click **Load unpacked** → go into the folder you unzipped → open the `dist` folder inside it → click **Select Folder**.

That's it. A green shield icon shows up in your toolbar. Open any Kick stream — the ads are blocked.

> **Important:** always select the `dist` folder, not the repo's root folder. The root folder holds source code and has no `manifest.json` — Chrome will throw an error if you load it.

#### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Go into the unzipped folder → open `dist` → select `manifest.json`
4. Open any Kick stream — the ads are blocked

> Note: Firefox temporary add-ons are removed when the browser closes. A permanent install requires the extension to be signed by Mozilla.

### Build from source

```bash
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build        # Chrome / Brave / Edge
# npm run build:firefox  # Firefox
```

The built extension lands in `dist/`. Load it as described above.

### How it works

**Layer 1 — Network blocking (`declarativeNetRequest`):** static rules block requests to ad-serving domains before they ever reach the page (Google GPT, IMA SDK, DoubleClick, and more).

**Layer 2 — Script stubs (MAIN world):** fake `window.googletag` and `window.google.ima` objects are injected at `document_start` and frozen, so the real ad scripts can't overwrite them.

**Layer 3 — DOM cleanup (`MutationObserver`):** ad containers and iframes are hidden the moment they appear.

### Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save settings and stats |
| `alarms` | Keep the service worker alive |
| `declarativeNetRequest` | Block ad domains at the network level |
| Host: `kick.com` | Inject the content script on Kick pages |

### License

[MIT](LICENSE)

---

## Español

Kick muestra sus anuncios a través de Google Publisher Tags (GPT) y el Google IMA SDK. Esta extensión neutraliza ambos —a nivel de red y a nivel de script—, de modo que los anuncios pre-roll y superpuestos nunca llegan a reproducirse.

### Instalación

#### Chrome, Brave o Edge — método más fácil (sin compilar)

La carpeta `dist/` de este repositorio ya es la extensión lista para cargar. No necesitas instalar Node.js ni ejecutar ningún comando.

**Paso 1 — Descarga el repositorio**

Haz clic en el botón verde **Code** de esta página → **Download ZIP** → descomprime el archivo en cualquier lugar de tu ordenador.

**Paso 2 — Abre la página de extensiones**

- Chrome: escribe `chrome://extensions` en la barra de direcciones y pulsa Enter
- Brave: escribe `brave://extensions`
- Edge: escribe `edge://extensions`

**Paso 3 — Activa el modo de desarrollador**

En la esquina superior derecha de la página de extensiones, activa el **Modo de desarrollador**. Aparecerá una nueva barra de herramientas.

**Paso 4 — Carga la extensión**

Haz clic en **Cargar descomprimida** → entra en la carpeta que descomprimiste → abre la carpeta `dist` que hay dentro → haz clic en **Seleccionar carpeta**.

Listo. Un icono de escudo verde aparece en tu barra de herramientas. Abre cualquier directo de Kick — los anuncios están bloqueados.

> **Importante:** selecciona siempre la carpeta `dist`, no la carpeta raíz del repositorio. La raíz contiene código fuente y no tiene `manifest.json` — Chrome mostrará un error si la cargas.

#### Firefox

1. Ve a `about:debugging#/runtime/this-firefox`
2. Haz clic en **Cargar complemento temporal**
3. Entra en la carpeta descomprimida → abre `dist` → selecciona `manifest.json`
4. Abre cualquier directo de Kick — los anuncios están bloqueados

> Nota: los complementos temporales de Firefox se eliminan al cerrar el navegador. Una instalación permanente requiere que la extensión esté firmada por Mozilla.

### Compilar desde el código

```bash
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build        # Chrome / Brave / Edge
# npm run build:firefox  # Firefox
```

La extensión compilada queda en `dist/`. Cárgala como se describe arriba.

### Cómo funciona

**Capa 1 — Bloqueo de red (`declarativeNetRequest`):** reglas estáticas bloquean las peticiones a los dominios de anuncios antes de que lleguen a la página (Google GPT, IMA SDK, DoubleClick y más).

**Capa 2 — Stubs de script (mundo MAIN):** se inyectan objetos falsos `window.googletag` y `window.google.ima` en `document_start` y se congelan, así los scripts de anuncios reales no pueden sobrescribirlos.

**Capa 3 — Limpieza del DOM (`MutationObserver`):** los contenedores e iframes de anuncios se ocultan en cuanto aparecen.

### Permisos

| Permiso | Para qué |
|---------|----------|
| `storage` | Guardar ajustes y estadísticas |
| `alarms` | Mantener vivo el service worker |
| `declarativeNetRequest` | Bloquear dominios de anuncios a nivel de red |
| Host: `kick.com` | Inyectar el content script en las páginas de Kick |

### Licencia

[MIT](LICENSE)

---

## Português (BR)

O Kick exibe seus anúncios via Google Publisher Tags (GPT) e o Google IMA SDK. Esta extensão neutraliza os dois — no nível de rede e no nível de script —, de modo que os anúncios pre-roll e sobrepostos nunca chegam a tocar.

### Instalação

#### Chrome, Brave ou Edge — método mais fácil (sem compilar)

A pasta `dist/` deste repositório já é a extensão pronta para carregar. Você não precisa instalar o Node.js nem rodar nenhum comando.

**Passo 1 — Baixe o repositório**

Clique no botão verde **Code** nesta página → **Download ZIP** → descompacte o arquivo em qualquer lugar do seu computador.

**Passo 2 — Abra a página de extensões**

- Chrome: cole `chrome://extensions` na barra de endereços e pressione Enter
- Brave: cole `brave://extensions`
- Edge: cole `edge://extensions`

**Passo 3 — Ative o modo de desenvolvedor**

No canto superior direito da página de extensões, ative o **Modo do desenvolvedor**. Uma nova barra de ferramentas aparece.

**Passo 4 — Carregue a extensão**

Clique em **Carregar sem compactação** → entre na pasta que você descompactou → abra a pasta `dist` dentro dela → clique em **Selecionar pasta**.

Pronto. Um ícone de escudo verde aparece na sua barra de ferramentas. Abra qualquer transmissão da Kick — os anúncios estão bloqueados.

> **Importante:** selecione sempre a pasta `dist`, não a pasta raiz do repositório. A raiz contém código-fonte e não tem `manifest.json` — o Chrome mostrará um erro se você carregá-la.

#### Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em **Carregar extensão temporária**
3. Entre na pasta descompactada → abra `dist` → selecione `manifest.json`
4. Abra qualquer transmissão da Kick — os anúncios estão bloqueados

> Nota: extensões temporárias do Firefox são removidas quando o navegador é fechado. Uma instalação permanente exige que a extensão seja assinada pela Mozilla.

### Compilar a partir do código

```bash
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build        # Chrome / Brave / Edge
# npm run build:firefox  # Firefox
```

A extensão compilada fica em `dist/`. Carregue-a como descrito acima.

### Como funciona

**Camada 1 — Bloqueio de rede (`declarativeNetRequest`):** regras estáticas bloqueiam as requisições aos domínios de anúncios antes que cheguem à página (Google GPT, IMA SDK, DoubleClick e outros).

**Camada 2 — Stubs de script (mundo MAIN):** objetos falsos `window.googletag` e `window.google.ima` são injetados em `document_start` e congelados, então os scripts de anúncios reais não conseguem sobrescrevê-los.

**Camada 3 — Limpeza do DOM (`MutationObserver`):** contêineres e iframes de anúncios são ocultados assim que aparecem.

### Permissões

| Permissão | Para quê |
|-----------|----------|
| `storage` | Salvar configurações e estatísticas |
| `alarms` | Manter o service worker ativo |
| `declarativeNetRequest` | Bloquear domínios de anúncios no nível de rede |
| Host: `kick.com` | Injetar o content script nas páginas da Kick |

### Licença

[MIT](LICENSE)

---

## 日本語

Kick は Google Publisher Tags（GPT）と Google IMA SDK を通じて広告を配信しています。この拡張機能はネットワークレベルとスクリプトレベルの両方でその両方を無効化するため、プリロール広告もオーバーレイ広告もそもそも再生されません。

### インストール方法

#### Chrome、Brave、または Edge — 最も簡単な方法（ビルド不要）

このリポジトリの `dist/` フォルダはそのまま読み込める拡張機能です。Node.js のインストールやコマンドの実行は一切不要です。

**ステップ 1 — リポジトリをダウンロードする**

このページの緑色の **Code** ボタンをクリック → **Download ZIP** → ダウンロードしたファイルをパソコンの好きな場所に解凍します。

**ステップ 2 — 拡張機能ページを開く**

- Chrome: アドレスバーに `chrome://extensions` と入力して Enter を押す
- Brave: `brave://extensions`
- Edge: `edge://extensions`

**ステップ 3 — デベロッパーモードを有効にする**

拡張機能ページの右上にある **デベロッパーモード** をオンにします。新しいツールバーが表示されます。

**ステップ 4 — 拡張機能を読み込む**

**パッケージ化されていない拡張機能を読み込む** をクリック → 解凍したフォルダに移動 → その中の `dist` フォルダを開く → **フォルダを選択** をクリック。

以上です。ツールバーに緑色のシールドアイコンが表示されます。Kick の配信を開いてください — 広告はブロックされています。

> **重要:** 必ず `dist` フォルダを選択してください。リポジトリのルートフォルダではありません。ルートフォルダにはソースコードが入っており `manifest.json` がないため、Chrome はエラーを表示します。

#### Firefox

1. `about:debugging#/runtime/this-firefox` にアクセス
2. **一時的なアドオンを読み込む** をクリック
3. 解凍したフォルダに移動 → `dist` を開く → `manifest.json` を選択
4. Kick の配信を開いてください — 広告はブロックされています

> 注意: Firefox の一時的なアドオンはブラウザを閉じると削除されます。永続的なインストールには Mozilla による署名が必要です。

### ソースからビルド

```bash
git clone https://github.com/Pkkls/kick-ad-blocker.git
cd kick-ad-blocker
npm install
npm run build        # Chrome / Brave / Edge
# npm run build:firefox  # Firefox
```

ビルドされた拡張機能は `dist/` に出力されます。上記の手順で読み込んでください。

### 仕組み

**レイヤー 1 — ネットワークブロック（`declarativeNetRequest`）:** 静的ルールが、広告配信ドメインへのリクエストをページに届く前にブロックします（Google GPT、IMA SDK、DoubleClick など）。

**レイヤー 2 — スクリプトのスタブ（MAIN ワールド）:** 偽の `window.googletag` と `window.google.ima` オブジェクトを `document_start` で注入して凍結するため、本物の広告スクリプトが上書きできません。

**レイヤー 3 — DOM のクリーンアップ（`MutationObserver`）:** 広告のコンテナや iframe が現れた瞬間に非表示にします。

### 権限

| 権限 | 用途 |
|------|------|
| `storage` | 設定と統計を保存 |
| `alarms` | service worker を生かし続ける |
| `declarativeNetRequest` | ネットワークレベルで広告ドメインをブロック |
| ホスト: `kick.com` | Kick のページに content script を注入 |

### ライセンス

[MIT](LICENSE)
