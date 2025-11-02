import { type PostWithBeverages } from "../types";
import "../assets/styles/post-list.scss";

interface PostListProps {
  posts: PostWithBeverages[];
  loading: boolean;
}

export default function PostList({ posts, loading }: PostListProps) {
  if (loading) {
    return <div className="post-list--loading">読み込み中...</div>;
  }

  if (posts.length === 0) {
    return <div className="post-list--empty">まだ投稿がありません</div>;
  }

  return (
    <div className="post-list">
      <h2 className="post-list--title">投稿一覧 ({posts.length}件)</h2>
      <div className="post-list--container">
        {posts.map((post) => (
          <div key={post.id} className="post-list--item">
            <div className="post-list--item-header">
              <h3 className="post-list--item-title">{post.date}</h3>
              <div className="post-list--item-date">
                {new Date(post.created_at).toLocaleString("ja-JP")}
              </div>
            </div>

            {post.comment && (
              <div className="post-list--item-comment">{post.comment}</div>
            )}

            {post.beverages.length > 0 && (
              <div>
                <div className="post-list--item-beverages-label">
                  飲んだお酒:
                </div>
                <ul className="post-list--item-beverages-list">
                  {post.beverages.map((beverage, index) => (
                    <li key={index}>
                      {beverage.beverage_name} - {beverage.amount}ml
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
