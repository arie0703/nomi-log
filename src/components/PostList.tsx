import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { type PostWithBeverages } from "../types";
import { calculateAlcoholIntake } from "../utils/alcohol";
import PostEditDialog from "./PostEditDialog";
import "../assets/styles/post-list.scss";

interface PostListProps {
  posts: PostWithBeverages[];
  loading: boolean;
  onPostUpdated: () => void;
}

export default function PostList({
  posts,
  loading,
  onPostUpdated,
}: PostListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithBeverages | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = (postId: number) => {
    setDeletingPostId(postId);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingPostId === null) return;

    try {
      await invoke("delete_post", { id: deletingPostId });
      setDeleteDialogOpen(false);
      setDeletingPostId(null);
      onPostUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿の削除に失敗しました");
      console.error("Error deleting post:", err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletingPostId(null);
    setError(null);
  };

  const handleEditClick = (post: PostWithBeverages) => {
    setEditingPost(post);
    setEditDialogOpen(true);
    setError(null);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingPost(null);
    setError(null);
  };

  const handlePostUpdated = () => {
    onPostUpdated(); // 投稿一覧を再読み込み
  };

  if (loading) {
    return <div className="post-list--loading">読み込み中...</div>;
  }

  if (posts.length === 0) {
    return <div className="post-list--empty">まだ投稿がありません</div>;
  }

  return (
    <div className="post-list">
      <h2 className="post-list--title">投稿一覧 ({posts.length}件)</h2>
      {error && <div className="post-list--error">エラー: {error}</div>}
      <div className="post-list--container">
        {posts.map((post) => (
            <div key={post.id} className="post-list--item">
            <div className="post-list--item-header">
              <div className="post-list--item-header-content">
                <h3 className="post-list--item-title">{post.date}</h3>
              </div>
              <div className="post-list--item-actions">
                <IconButton
                  onClick={() => handleEditClick(post)}
                  className="post-list--item-edit-button"
                  size="small"
                  aria-label="編集"
                >
                  <EditIcon sx={{ color: "#1976d2" }} />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteClick(post.id)}
                  className="post-list--item-delete-button"
                  size="small"
                  aria-label="削除"
                >
                  <DeleteIcon sx={{ color: "#d32f2f" }} />
                </IconButton>
              </div>
            </div>

            {post.comment && (
              <div className="post-list--item-comment">{post.comment}</div>
            )}

            {post.beverages.length > 0 && (
              <>
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
                <div className="post-list--item-alcohol-intake">
                  アルコール摂取量:{" "}
                  {calculateAlcoholIntake(post.beverages).toFixed(1)} ml
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            backgroundColor: "#1e1e1e",
            color: "#e0e0e0",
          },
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: "#e0e0e0" }}>
          投稿の削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="delete-dialog-description"
            sx={{ color: "#b0b0b0" }}
          >
            この投稿を削除しますか？この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      <PostEditDialog
        open={editDialogOpen}
        editingPost={editingPost}
        onClose={handleEditClose}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
}
