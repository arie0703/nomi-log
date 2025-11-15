import {
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { type PostWithBeverages } from "../types";
import PostForm from "./PostForm";

interface PostEditDialogProps {
  open: boolean;
  editingPost: PostWithBeverages | null;
  onClose: () => void;
  onPostUpdated: () => void;
}

export default function PostEditDialog({
  open,
  editingPost,
  onClose,
  onPostUpdated,
}: PostEditDialogProps) {
  const handlePostUpdated = () => {
    onPostUpdated();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="edit-dialog-title"
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1e1e1e",
          color: "#e0e0e0",
        },
      }}
    >
      <DialogTitle id="edit-dialog-title" sx={{ color: "#e0e0e0" }}>
        投稿を編集
      </DialogTitle>
      <DialogContent>
        <PostForm
          editingPost={editingPost}
          onPostCreated={() => {}} // 編集時は使用しない
          onPostUpdated={handlePostUpdated}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

