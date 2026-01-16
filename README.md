# YouTube Gallery App

YouTubeの動画をサムネイルで一覧表示・管理できるWebアプリケーションです。

## Features

- ユーザー登録・ログイン（Firebase Authentication）
- YouTube動画の登録（URL、タイトル、タグ）
- サムネイルのパネル表示ギャラリー
- 動画名・タグでの検索機能
- 共有URL発行機能（他者への公開）

## Tech Stack

- React + TypeScript + Vite
- Firebase (Authentication, Firestore)
- Tailwind CSS
- shadcn/ui

## Setup

### 1. Firebase Project Setup

1. [Firebase Console](https://console.firebase.google.com/)で新規プロジェクトを作成
2. Authentication → Sign-in method で「メール/パスワード」を有効化
3. Firestore Database を作成（本番モードまたはテストモード）
4. プロジェクト設定 → マイアプリ → ウェブアプリを追加

### 2. Environment Variables

`.env.example`をコピーして`.env`を作成し、Firebaseの設定値を入力:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules

Firestore Databaseのルールを以下のように設定:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /videos/{videoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Install & Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
