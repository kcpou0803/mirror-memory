# Mirror Memory

一個訓練瞬間視覺記憶與空間工作記憶的瀏覽器遊戲。使用 React、TypeScript、Vite 與 Vitest。

## 執行

需要先安裝 Node.js 20 或更新版本，然後在此資料夾執行：

```powershell
npm install
npm run dev
```

Vite 會在終端顯示本機網址（通常是 `http://localhost:5173`）。

## 驗證

```powershell
npm test
npm run build
```

## 單一 HTML 檔案

```powershell
npm.cmd run build:single
```

執行後會在專案根目錄產生 `mirror-memory.html`。這個檔案已內嵌 JavaScript 與 CSS，可直接雙擊開啟或傳給其他人離線遊玩。

核心規則位於 `src/game`，React 畫面元件位於 `src/components`。難度數值集中在 `src/game/config.ts`。
