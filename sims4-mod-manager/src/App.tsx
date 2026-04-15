import { useEffect, useState } from "react";
import "./App.css";
import plumbob from "./assets/plumbob.png";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";

type Page = "splash" | "zipVault" | "extractedFiles" | "settings";

type ZipItem = {
  id: number;
  name: string;
  size: string;
  status?: "pending" | "extracted" | "failed" | string;
};

type PackageItem = {
  id: number;
  name: string;
  size: string;
  type: string;
  source: string;
  author: string;
  preview?: string;
};

const translations = {
  en: {
    common: {
      brand: "Sims Mod Manager",
      zips: "ZIPS",
      extracted: "EXTRACTED",
      settings: "SETTINGS",
      updates: "UPDATES",
      chooseZipFolder: "CHOOSE ZIP FOLDER",
      chooseOutputFolder: "CHOOSE OUTPUT FOLDER",
      openOutputFolder: "OPEN OUTPUT FOLDER",
      openModsFolder: "OPEN MODS FOLDER",
      extractAll: "⬆ Extract All",
      extracting: "EXTRACTING...",
      searchZipFiles: "Search zip files...",
      searchExtractedFiles: "Search extracted files...",
      readyToExtract: "Ready to extract",
      readyToReview: "Ready to review",
      viewLicense: "VIEW LICENSE",
    },
    splash: {
      title: "SIMS-4-MOD-ZIP-MANAGER",
      subtitle: "BATCH EXTRACT YOUR ZIP FILES INTO ONE ORGANIZED FOLDER",
      launch: "▶ LAUNCH APPLICATION",
      updateNotes: "UPDATE NOTES",
      githubRepo: "GITHUB REPO",
    },
    settings: {
      title: "Settings",
      subtitle: "APP PREFERENCES AND OUTPUT RULES",
      language: "Language",
      languageDesc: "Choose the display language for the application.",
      outputFolder: "Default Output Folder",
      outputDesc: "Choose where extracted files will be placed by default.",
      noDefaultOutput: "No default output folder selected yet",
      extractionTypesTitle: "Extraction Types",
      extractionTypesDesc: "Select which file types should be extracted from zip archives.",
      licenseTitle: "License",
      licenseDesc: "Open-source license and legal details.",
      aboutTitle: "About",
      aboutDesc: "Application identity and version information.",
      github: "GitHub",
      githubDesc: "Project repository and release notes.",
      openRepo: "OPEN REPOSITORY",
    },
    zipVault: {
      title: "Zips",
      zipFolder: "ZIP FOLDER",
      archivesReady: "ARCHIVES READY FOR EXTRACTION",
      noArchiveFolder: "No ARCHIVE FOLDER selected yet",
      setupHint:
        "Output folder not set yet. Go to the Extracted page and choose an output folder first.",
      scannedSuffix: "zip files shown",
      chooseBoth: "Choose both ZIP folder and output folder first",
    },
    extracted: {
      title: "Extracted",
      filesExtracted: "FILES EXTRACTED FROM ZIP ARCHIVES",
      outputFolder: "OUTPUT FOLDER",
      noOutputFolder: "No output folder selected yet",
      extractedFiles: "Extracted files",
      fileProperties: "FILE PROPERTIES",
      extractedFileDetails: "EXTRACTED FILE DETAILS",
      packageType: "PACKAGE TYPE",
      sourceZip: "SOURCE ZIP",
      author: "AUTHOR",
    },
  },
  zh: {
    common: {
      brand: "Sims Mod Manager",
      zips: "压缩包",
      extracted: "已解压",
      settings: "设置",
      updates: "更新",
      chooseZipFolder: "选择 ZIP 文件夹",
      chooseOutputFolder: "选择输出文件夹",
      openOutputFolder: "打开输出文件夹",
      openModsFolder: "打开 Mods 文件夹",
      extractAll: "⬆ 全部解压",
      extracting: "解压中...",
      searchZipFiles: "搜索 zip 文件...",
      searchExtractedFiles: "搜索已解压文件...",
      readyToExtract: "准备解压",
      readyToReview: "可以查看",
      viewLicense: "查看许可证",
    },
    splash: {
      title: "SIMS-4-MOD-ZIP-MANAGER",
      subtitle: "批量解压 ZIP 文件到一个整理好的文件夹",
      launch: "▶ 启动应用",
      updateNotes: "更新说明",
      githubRepo: "GITHUB 仓库",
    },
    settings: {
      title: "设置",
      subtitle: "应用偏好和输出规则",
      language: "语言",
      languageDesc: "选择应用显示语言。",
      outputFolder: "默认输出文件夹",
      outputDesc: "选择解压文件默认保存的位置。",
      noDefaultOutput: "还没有选择默认输出文件夹",
      extractionTypesTitle: "解压类型",
      extractionTypesDesc: "选择从压缩包中解压哪些文件类型。",
      licenseTitle: "许可证",
      licenseDesc: "开源许可证和法律信息。",
      aboutTitle: "关于",
      aboutDesc: "应用标识和版本信息。",
      github: "GitHub",
      githubDesc: "项目仓库和发布说明。",
      openRepo: "打开仓库",
    },
    zipVault: {
      title: "压缩包",
      zipFolder: "ZIP 文件夹",
      archivesReady: "个压缩包已准备解压",
      noArchiveFolder: "还没有选择压缩包文件夹",
      setupHint: "还没有设置输出文件夹。请前往 Extracted 页面先选择输出文件夹。",
      scannedSuffix: "个 zip 文件显示中",
      chooseBoth: "请先选择 ZIP 文件夹和输出文件夹",
    },
    extracted: {
      title: "已解压",
      filesExtracted: "个文件已从压缩包中解压",
      outputFolder: "输出文件夹",
      noOutputFolder: "还没有选择输出文件夹",
      extractedFiles: "已解压文件",
      fileProperties: "文件属性",
      extractedFileDetails: "已解压文件详情",
      packageType: "文件类型",
      sourceZip: "来源压缩包",
      author: "作者",
    },
  },
  ja: {
    common: {
      brand: "Sims Mod Manager",
      zips: "ZIP",
      extracted: "展開済み",
      settings: "設定",
      updates: "更新",
      chooseZipFolder: "ZIPフォルダを選択",
      chooseOutputFolder: "出力フォルダを選択",
      openOutputFolder: "出力フォルダを開く",
      openModsFolder: "Mods フォルダを開く",
      extractAll: "⬆ すべて展開",
      extracting: "展開中...",
      searchZipFiles: "zip ファイルを検索...",
      searchExtractedFiles: "展開済みファイルを検索...",
      readyToExtract: "展開準備完了",
      readyToReview: "確認可能",
      viewLicense: "ライセンスを見る",
    },
    splash: {
      title: "SIMS-4-MOD-ZIP-MANAGER",
      subtitle: "ZIP ファイルを一つの整理されたフォルダに一括展開",
      launch: "▶ アプリを起動",
      updateNotes: "更新ノート",
      githubRepo: "GITHUB リポジトリ",
    },
    settings: {
      title: "設定",
      subtitle: "アプリ設定と出力ルール",
      language: "言語",
      languageDesc: "アプリの表示言語を選択します。",
      outputFolder: "デフォルト出力フォルダ",
      outputDesc: "展開ファイルの保存先を選択します。",
      noDefaultOutput: "デフォルト出力フォルダがまだ選択されていません",
      extractionTypesTitle: "展開タイプ",
      extractionTypesDesc: "ZIP アーカイブから展開するファイルタイプを選択します。",
      licenseTitle: "ライセンス",
      licenseDesc: "オープンソースライセンスと法的情報。",
      aboutTitle: "概要",
      aboutDesc: "アプリ情報とバージョン情報。",
      github: "GitHub",
      githubDesc: "プロジェクトのリポジトリとリリースノート。",
      openRepo: "リポジトリを開く",
    },
    zipVault: {
      title: "ZIP",
      zipFolder: "ZIP フォルダ",
      archivesReady: "個のアーカイブが展開準備完了",
      noArchiveFolder: "ZIP フォルダがまだ選択されていません",
      setupHint: "出力フォルダが未設定です。Extracted ページで先に選択してください。",
      scannedSuffix: "個の zip ファイルを表示中",
      chooseBoth: "ZIP フォルダと出力フォルダを先に選択してください",
    },
    extracted: {
      title: "展開済み",
      filesExtracted: "個のファイルが ZIP から展開されました",
      outputFolder: "出力フォルダ",
      noOutputFolder: "出力フォルダがまだ選択されていません",
      extractedFiles: "展開済みファイル",
      fileProperties: "ファイル情報",
      extractedFileDetails: "展開済みファイル詳細",
      packageType: "ファイル種類",
      sourceZip: "元の ZIP",
      author: "作者",
    },
  },
  ko: {
    common: {
      brand: "Sims Mod Manager",
      zips: "ZIP",
      extracted: "추출됨",
      settings: "설정",
      updates: "업데이트",
      chooseZipFolder: "ZIP 폴더 선택",
      chooseOutputFolder: "출력 폴더 선택",
      openOutputFolder: "출력 폴더 열기",
      openModsFolder: "Mods 폴더 열기",
      extractAll: "⬆ 모두 압축 해제",
      extracting: "압축 해제 중...",
      searchZipFiles: "zip 파일 검색...",
      searchExtractedFiles: "추출된 파일 검색...",
      readyToExtract: "압축 해제 준비 완료",
      readyToReview: "검토 가능",
      viewLicense: "라이선스 보기",
    },
    splash: {
      title: "SIMS-4-MOD-ZIP-MANAGER",
      subtitle: "ZIP 파일을 정리된 하나의 폴더로 일괄 압축 해제",
      launch: "▶ 앱 실행",
      updateNotes: "업데이트 노트",
      githubRepo: "GITHUB 저장소",
    },
    settings: {
      title: "설정",
      subtitle: "앱 환경설정 및 출력 규칙",
      language: "언어",
      languageDesc: "앱 표시 언어를 선택하세요.",
      outputFolder: "기본 출력 폴더",
      outputDesc: "압축 해제 파일의 기본 저장 위치를 선택하세요.",
      noDefaultOutput: "기본 출력 폴더가 아직 선택되지 않았습니다",
      extractionTypesTitle: "추출 유형",
      extractionTypesDesc: "zip 아카이브에서 추출할 파일 유형을 선택하세요.",
      licenseTitle: "라이선스",
      licenseDesc: "오픈소스 라이선스 및 법적 정보.",
      aboutTitle: "정보",
      aboutDesc: "앱 식별 정보 및 버전 정보.",
      github: "GitHub",
      githubDesc: "프로젝트 저장소 및 릴리스 노트.",
      openRepo: "저장소 열기",
    },
    zipVault: {
      title: "ZIP",
      zipFolder: "ZIP 폴더",
      archivesReady: "개의 압축파일이 준비됨",
      noArchiveFolder: "ZIP 폴더가 아직 선택되지 않았습니다",
      setupHint: "출력 폴더가 아직 설정되지 않았습니다. 먼저 Extracted 페이지에서 선택하세요.",
      scannedSuffix: "개의 zip 파일 표시 중",
      chooseBoth: "먼저 ZIP 폴더와 출력 폴더를 선택하세요",
    },
    extracted: {
      title: "추출됨",
      filesExtracted: "개의 파일이 ZIP에서 추출됨",
      outputFolder: "출력 폴더",
      noOutputFolder: "출력 폴더가 아직 선택되지 않았습니다",
      extractedFiles: "추출된 파일",
      fileProperties: "파일 속성",
      extractedFileDetails: "추출된 파일 상세",
      packageType: "파일 유형",
      sourceZip: "원본 ZIP",
      author: "작성자",
    },
  },
} as const;

type LanguageKey = keyof typeof translations;
type TranslationSet = (typeof translations)[LanguageKey];

const extractedMockData: PackageItem[] = [
  {
    id: 1,
    name: "elegant_dress.package",
    size: "1.2 MB",
    type: "Clothing / CAS Part",
    source: "Victorian_Set_V2.zip",
    author: "SimmerStudio_Pink",
    preview: plumbob,
  },
  {
    id: 2,
    name: "summer_hair.package",
    size: "450 KB",
    type: "Hair / CAS Part",
    source: "Summer_Vibes.zip",
    author: "LunaSims",
    preview: plumbob,
  },
  {
    id: 3,
    name: "vintage_shoes.package",
    size: "2.1 MB",
    type: "Shoes / CAS Part",
    source: "Vintage_Finds.zip",
    author: "PinkPixel",
    preview: plumbob,
  },
  {
    id: 4,
    name: "cozy_knit_top.package",
    size: "890 KB",
    type: "Top / CAS Part",
    source: "Winter_Coats.zip",
    author: "RosyMods",
    preview: plumbob,
  },
  {
    id: 5,
    name: "silk_ribbon_hair.package",
    size: "320 KB",
    type: "Hair Accessory",
    source: "Hair_Pack.zip",
    author: "SoftBerry",
    preview: plumbob,
  },
  {
    id: 6,
    name: "garden_planter.package",
    size: "1.5 MB",
    type: "Build / Buy",
    source: "Garden_Deco.zip",
    author: "BloomSims",
    preview: plumbob,
  },
  {
    id: 7,
    name: "pink_rug.package",
    size: "950 KB",
    type: "Decor",
    source: "Rug_Overhaul.zip",
    author: "RosyMods",
    preview: plumbob,
  },
  {
    id: 8,
    name: "diamond_wall_art.package",
    size: "2.0 MB",
    type: "Decor",
    source: "Wall_Art_Set.zip",
    author: "SoftBerry",
    preview: plumbob,
  },
];

function Sidebar({
  currentPage,
  onNavigate,
  t,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  t: TranslationSet;
}) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-logo" />
          <span>{t.common.brand}</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === "zipVault" ? "active" : ""}`}
            onClick={() => onNavigate("zipVault")}
          >
            <span className="nav-icon">🗂</span>
            <span>{t.common.zips}</span>
          </button>

          <button
            className={`nav-item ${currentPage === "extractedFiles" ? "active" : ""}`}
            onClick={() => onNavigate("extractedFiles")}
          >
            <span className="nav-icon">📦</span>
            <span>{t.common.extracted}</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button
          className={`nav-item small ${currentPage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="nav-icon">⚙</span>
          <span>{t.common.settings}</span>
        </button>

        <button className="nav-item small">
          <span className="nav-icon">⬇</span>
          <span>{t.common.updates}</span>
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return <div className="topbar" />;
}

function SplashScreen({
  onLaunch,
  t,
}: {
  onLaunch: () => void;
  t: TranslationSet;
}) {
  return (
    <div className="welcome-screen">
      <div className="welcome-top">
        <div className="welcome-brand">
          <div className="brand-logo" />
          <span>{t.common.brand}</span>
        </div>
      </div>

      <div className="welcome-content">
        <div className="floating-gift gift-1">🎁</div>
        <div className="floating-gift gift-2">🎁</div>
        <div className="floating-gift gift-3">🎁</div>

        <img src={plumbob} alt="Plumbob logo" className="welcome-logo" />

        <h1>{t.splash.title}</h1>
        <p>{t.splash.subtitle}</p>

        <button className="launch-button" onClick={onLaunch}>
          {t.splash.launch}
        </button>

        <div className="splash-links">
          <button type="button">{t.splash.updateNotes}</button>
          <span>•</span>
          <button type="button">{t.splash.githubRepo}</button>
        </div>
      </div>
    </div>
  );
}

function ZipVault({
  items,
  selectedId,
  setSelectedId,
  onExtractAll,
  zipFolderPath,
  onChooseZipFolder,
  isWorking,
  canExtract,
  outputFolderPath,
  t,
}: {
  items: ZipItem[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
  onExtractAll: () => void;
  zipFolderPath: string;
  onChooseZipFolder: () => void;
  isWorking: boolean;
  canExtract: boolean;
  outputFolderPath: string;
  t: TranslationSet;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-shell">
      <div className="center-panel wide">
        <div className="panel-header zip-header">
          <div className="zip-header-top">
            <div className="zip-title-block">
              <h2>{t.zipVault.title}</h2>
            </div>

            <div className="search-box zip-search">
              <span>⌕</span>
              <input
                placeholder={t.common.searchZipFiles}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="zip-header-actions-row">
            <button
              className="secondary-button header-button zip-folder-button"
              onClick={onChooseZipFolder}
            >
              {t.common.chooseZipFolder}
            </button>

            <button
              className="primary-button header-button primary-action"
              onClick={onExtractAll}
              disabled={!canExtract || isWorking}
              title={!canExtract ? t.zipVault.chooseBoth : ""}
            >
              {isWorking ? t.common.extracting : t.common.extractAll}
            </button>
          </div>

          {zipFolderPath && !outputFolderPath && (
            <div className="setup-hint">{t.zipVault.setupHint}</div>
          )}

          <div className="zip-header-bottom">
            <div className="folder-path-block zip-folder-block">
              <div className="folder-emphasis">{t.zipVault.zipFolder}</div>
              <div className="zip-substatus">
                {items.length} {t.zipVault.archivesReady}
              </div>
              <div
                className={`folder-path-value ${!zipFolderPath ? "empty-path" : ""}`}
              >
                {zipFolderPath || t.zipVault.noArchiveFolder}
              </div>
            </div>
          </div>
        </div>

        <div className="card-grid zip-grid">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className={`asset-card zip-card ${selectedId === item.id ? "selected" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="thumb zip-thumb">🗂</div>
              <div className="asset-name">{item.name}</div>
              <div className="asset-size">{item.size}</div>
            </button>
          ))}
        </div>

        <div className="bottom-progress">
          <div className="progress-meta">
            <span>
              {filteredItems.length} {t.zipVault.scannedSuffix}
            </span>
            <span>{t.common.readyToExtract}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtractedFiles({
  items,
  selectedId,
  setSelectedId,
  outputFolderPath,
  onChooseOutputFolder,
  onOpenOutputFolder,
  onOpenModsFolder,
  canOpenOutputFolder,
  t,
}: {
  items: PackageItem[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
  outputFolderPath: string;
  onChooseOutputFolder: () => void;
  onOpenOutputFolder: () => void;
  onOpenModsFolder: () => void;
  canOpenOutputFolder: boolean;
  t: TranslationSet;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem =
    filteredItems.find((item) => item.id === selectedId) ??
    items.find((item) => item.id === selectedId) ??
    filteredItems[0] ??
    items[0];

  return (
    <div className="page-shell three-columns">
      <div className="center-panel">
        <div className="panel-header extracted-header">
          <div className="extracted-header-top extracted-header-top-clean">
            <div>
              <h2>{t.extracted.title}</h2>
              <p>
                {items.length} {t.extracted.filesExtracted}
              </p>
            </div>

            <div className="extracted-top-controls">
              <div className="search-box extracted-search">
                <span>⌕</span>
                <input
                  placeholder={t.common.searchExtractedFiles}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                className="secondary-button header-button extracted-folder-button"
                onClick={onChooseOutputFolder}
              >
                {t.common.chooseOutputFolder}
              </button>

              <button
                className="install-button header-button extracted-open-button"
                onClick={onOpenOutputFolder}
                disabled={!canOpenOutputFolder}
              >
                {t.common.openOutputFolder}
              </button>
            </div>
          </div>

          <div className="extracted-header-bottom extracted-folder-row">
            <div className="folder-path-block">
              <div className="folder-emphasis">{t.extracted.outputFolder}</div>
              <div
                className={`path-value folder-path-value ${
                  !outputFolderPath ? "empty-path" : ""
                }`}
              >
                {outputFolderPath || t.extracted.noOutputFolder}
              </div>
            </div>
          </div>
        </div>

        <div className="card-grid package-grid">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className={`asset-card package-card ${
                selectedId === item.id ? "selected" : ""
              }`}
              onClick={() => setSelectedId(item.id)}
            >
              <div className="thumb package-thumb small-thumb">
                <img src={item.preview ?? plumbob} alt={item.name} />
              </div>
              <div className="asset-name">{item.name}</div>
              <div className="asset-size">{item.size}</div>
            </button>
          ))}
        </div>

        <div className="bottom-progress">
          <div className="progress-meta">
            <span>
              {t.extracted.extractedFiles}: {filteredItems.length}
            </span>
            <span>{t.common.readyToReview}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill extracted-fill" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="preview-card compact">
          <img src={selectedItem?.preview ?? plumbob} alt="Preview" />
        </div>

        <div className="properties-title">{t.extracted.fileProperties}</div>
        <div className="properties-subtitle">{t.extracted.extractedFileDetails}</div>

        <div className="property-box">
          <div className="property-label">{t.extracted.packageType}</div>
          <div className="property-value">{selectedItem?.type ?? "-"}</div>
        </div>

        <div className="property-box">
          <div className="property-label">{t.extracted.sourceZip}</div>
          <div className="property-value">{selectedItem?.source ?? "-"}</div>
        </div>

        <div className="property-box">
          <div className="property-label">{t.extracted.author}</div>
          <div className="property-value">{selectedItem?.author ?? "-"}</div>
        </div>

        <div className="property-box">
          <div className="property-label">{t.extracted.outputFolder}</div>
          <div className="property-value">{outputFolderPath || "-"}</div>
        </div>

        <div className="action-stack">
          <button
            className="secondary-button"
            onClick={onOpenOutputFolder}
            disabled={!canOpenOutputFolder}
          >
            {t.common.openOutputFolder}
          </button>

          <button className="danger-button" onClick={onOpenModsFolder}>
            {t.common.openModsFolder}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({
  onOpenGithub,
  onChooseDefaultOutputFolder,
  outputFolderPath,
  language,
  onChangeLanguage,
  t,
}: {
  onOpenGithub: () => void;
  onChooseDefaultOutputFolder: () => void;
  outputFolderPath: string;
  language: string;
  onChangeLanguage: (value: string) => void;
  t: TranslationSet;
}) {
  return (
    <div className="page-shell">
      <div className="settings-panel">
        <div className="panel-header">
          <div>
            <h2>{t.settings.title}</h2>
            <p>{t.settings.subtitle}</p>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h3>{t.settings.language}</h3>
            <p>{t.settings.languageDesc}</p>
            <select
              className="settings-select"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          <div className="settings-card">
            <h3>{t.settings.outputFolder}</h3>
            <p>{t.settings.outputDesc}</p>
            <button
              className="secondary-button small-btn"
              onClick={onChooseDefaultOutputFolder}
            >
              {t.common.chooseOutputFolder}
            </button>

            <div className="settings-info" style={{ marginTop: "12px" }}>
              {outputFolderPath || t.settings.noDefaultOutput}
            </div>
          </div>

          <div className="settings-card">
            <h3>{t.settings.extractionTypesTitle}</h3>
            <p>{t.settings.extractionTypesDesc}</p>
            <div className="settings-info">.package, .ts4script</div>
          </div>

          <div className="settings-card">
            <h3>{t.settings.licenseTitle}</h3>
            <p>{t.settings.licenseDesc}</p>
            <div className="settings-info">MIT License</div>
            <button className="secondary-button small-btn">
              {t.common.viewLicense}
            </button>
          </div>

          <div className="settings-card">
            <h3>{t.settings.aboutTitle}</h3>
            <p>{t.settings.aboutDesc}</p>
            <div className="settings-info">
              Sims 4 Mod ZIP Manager
              <br />
              Version 1.0.0
              <br />
              By Louisa Liu
            </div>
          </div>

          <div className="settings-card">
            <h3>{t.settings.github}</h3>
            <p>{t.settings.githubDesc}</p>
            <button className="primary-button small-btn" onClick={onOpenGithub}>
              {t.settings.openRepo}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("splash");
  const [zipItems, setZipItems] = useState<ZipItem[]>([]);
  const [extractedItems, setExtractedItems] = useState<PackageItem[]>([]);
  const [zipSelectedId, setZipSelectedId] = useState<number | null>(null);
  const [packageSelectedId, setPackageSelectedId] = useState<number | null>(null);
  const [zipFolderPath, setZipFolderPath] = useState("");
  const [outputFolderPath, setOutputFolderPath] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState<LanguageKey>("en");

  const t = translations[language];

  useEffect(() => {
    const savedOutput = localStorage.getItem("defaultOutputFolder");
    if (savedOutput) {
      setOutputFolderPath(savedOutput);
    }

    const savedLanguage = localStorage.getItem("appLanguage") as LanguageKey | null;
    if (savedLanguage && ["en", "zh", "ja", "ko"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleOpenModsFolder = async () => {
    try {
      setErrorMessage("");
      await invoke("open_mods_folder");
    } catch (error) {
      console.error(error);
      setErrorMessage(`Failed to open Mods folder: ${String(error)}`);
    }
  };

  const handleOpenGithub = async () => {
    try {
      setErrorMessage("");
      await invoke("open_github_repo");
    } catch (error) {
      console.error(error);
      setErrorMessage(`Failed to open repository: ${String(error)}`);
    }
  };

  const handleChangeLanguage = (value: string) => {
    if (value === "en" || value === "zh" || value === "ja" || value === "ko") {
      setLanguage(value);
      localStorage.setItem("appLanguage", value);
    }
  };

  const handleChooseZipFolder = async () => {
    try {
      setErrorMessage("");

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose ZIP Folder",
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      setZipFolderPath(selected);

      const scanned = await invoke<ZipItem[]>("scan_zip_folder", {
        folderPath: selected,
      });

      setZipItems(scanned);
      setZipSelectedId(scanned.length > 0 ? scanned[0].id : null);
    } catch (error) {
      console.error(error);
      setErrorMessage(String(error));
    }
  };

  const handleChooseOutputFolder = async () => {
    try {
      setErrorMessage("");

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose Output Folder",
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      setOutputFolderPath(selected);
      localStorage.setItem("defaultOutputFolder", selected);
    } catch (error) {
      console.error(error);
      setErrorMessage(String(error));
    }
  };

  const handleOpenOutputFolder = async () => {
    try {
      if (!outputFolderPath) {
        setErrorMessage("Please choose an output folder first.");
        return;
      }

      await openPath(outputFolderPath);
    } catch (error) {
      console.error(error);
      setErrorMessage(String(error));
    }
  };

  const handleExtractAll = async () => {
    try {
      setErrorMessage("");

      if (!zipFolderPath) {
        setErrorMessage("Please choose a ZIP folder first.");
        return;
      }

      if (!outputFolderPath) {
        setErrorMessage("Please choose an output folder first.");
        await handleChooseOutputFolder();
        return;
      }

      setIsWorking(true);

      const extracted = await invoke<
        Array<{
          id: number;
          name: string;
          size: string;
          file_type: string;
          source: string;
          author: string;
        }>
      >("extract_all_zips", {
        zipFolderPath,
        outputFolderPath,
      });

      const normalized: PackageItem[] = extracted.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.file_type,
        source: item.source,
        author: item.author,
        preview: plumbob,
      }));

      setExtractedItems(normalized);
      setPackageSelectedId(normalized.length > 0 ? normalized[0].id : null);
      setPage("extractedFiles");
    } catch (error) {
      console.error(error);
      setErrorMessage(String(error));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="app-shell">
      {errorMessage && <div className="app-error-banner">{errorMessage}</div>}
      {page === "splash" ? (
        <SplashScreen onLaunch={() => setPage("zipVault")} t={t} />
      ) : (
        <>
          <TopBar />
          <div className="main-layout">
            <Sidebar currentPage={page} onNavigate={setPage} t={t} />

            {page === "zipVault" && (
              <ZipVault
                items={zipItems}
                selectedId={zipSelectedId}
                setSelectedId={setZipSelectedId}
                onExtractAll={handleExtractAll}
                zipFolderPath={zipFolderPath}
                onChooseZipFolder={handleChooseZipFolder}
                isWorking={isWorking}
                canExtract={Boolean(zipFolderPath && outputFolderPath)}
                outputFolderPath={outputFolderPath}
                t={t}
              />
            )}

            {page === "extractedFiles" && (
              <ExtractedFiles
                items={extractedItems.length ? extractedItems : extractedMockData}
                selectedId={packageSelectedId}
                setSelectedId={setPackageSelectedId}
                outputFolderPath={outputFolderPath}
                onChooseOutputFolder={handleChooseOutputFolder}
                onOpenOutputFolder={handleOpenOutputFolder}
                onOpenModsFolder={handleOpenModsFolder}
                canOpenOutputFolder={Boolean(outputFolderPath)}
                t={t}
              />
            )}

            {page === "settings" && (
              <SettingsPage
                onOpenGithub={handleOpenGithub}
                onChooseDefaultOutputFolder={handleChooseOutputFolder}
                outputFolderPath={outputFolderPath}
                language={language}
                onChangeLanguage={handleChangeLanguage}
                t={t}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;