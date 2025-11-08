import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./assets/styles/app.scss";
import PostForm from "./components/PostForm";
import PostList from "./components/PostList";
import BeverageList from "./components/BeverageList";
import AlcoholIntakeView from "./components/AlcoholIntakeView";
import type { PostWithBeverages, Beverage } from "./types";

type Tab = "posts" | "beverages" | "alcohol-intake";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  // 投稿関連の状態
  const [posts, setPosts] = useState<PostWithBeverages[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  // お酒関連の状態
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [beveragesLoading, setBeveragesLoading] = useState(true);
  const [beveragesError, setBeveragesError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    } else if (activeTab === "beverages") {
      loadBeverages();
    }
    // alcohol-intakeタブの場合はデータロードは不要（コンポーネント内で処理）
  }, [activeTab]);

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      setPostsError(null);
      const result = await invoke<PostWithBeverages[]>("get_posts");
      setPosts(result);
    } catch (err) {
      setPostsError(
        err instanceof Error ? err.message : "投稿の取得に失敗しました"
      );
      console.error("Error loading posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadBeverages = async () => {
    try {
      setBeveragesLoading(true);
      setBeveragesError(null);
      const result = await invoke<Beverage[]>("get_beverages");
      setBeverages(result);
    } catch (err) {
      setBeveragesError(
        err instanceof Error ? err.message : "お酒の取得に失敗しました"
      );
      console.error("Error loading beverages:", err);
    } finally {
      setBeveragesLoading(false);
    }
  };

  return (
    <div className="app">
      <h1 className="app--title">飲みログ</h1>

      {/* タブ */}
      <div className="app--tabs">
        <button
          onClick={() => setActiveTab("posts")}
          className={`app--tab-button ${activeTab === "posts" ? "active" : ""}`}
        >
          飲酒記録
        </button>
        <button
          onClick={() => setActiveTab("beverages")}
          className={`app--tab-button ${
            activeTab === "beverages" ? "active" : ""
          }`}
        >
          酒棚
        </button>
        <button
          onClick={() => setActiveTab("alcohol-intake")}
          className={`app--tab-button ${
            activeTab === "alcohol-intake" ? "active" : ""
          }`}
        >
          飲酒量
        </button>
      </div>

      {/* 投稿タブ */}
      {activeTab === "posts" && (
        <div className="app--content">
          {postsError && <div className="app--error">エラー: {postsError}</div>}

          <PostForm onPostCreated={loadPosts} />
          <PostList
            posts={posts}
            loading={postsLoading}
            onPostDeleted={loadPosts}
          />
        </div>
      )}

      {/* お酒管理タブ */}
      {activeTab === "beverages" && (
        <div className="app--content">
          {beveragesError && (
            <div className="app--error">エラー: {beveragesError}</div>
          )}

          <BeverageList
            beverages={beverages}
            loading={beveragesLoading}
            onBeverageDeleted={loadBeverages}
            onBeverageSaved={loadBeverages}
          />
        </div>
      )}

      {/* 飲酒量タブ */}
      {activeTab === "alcohol-intake" && (
        <div className="app--content">
          <AlcoholIntakeView />
        </div>
      )}
    </div>
  );
}

export default App;
