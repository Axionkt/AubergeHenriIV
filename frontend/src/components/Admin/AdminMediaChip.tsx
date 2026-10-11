import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import styles from "./Admin.module.css";
import { AdminMediaListItem } from "../../types/media";

export default function AdminMediaChip({
  item,
  index,
  marked,
  onToggle,
}: {
  item: AdminMediaListItem;
  index: number;
  marked: boolean;
  onToggle: () => void;
}) {
  const isVideo = item.type === "video";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.7 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.mediaChip} ${marked ? styles.mediaChipMarked : ""} ${isDragging ? styles.mediaChipDragging : ""}`}
      {...attributes}
      {...listeners}
    >
      {isVideo ? (
        <div className={styles.mediaChipVideo}>▶</div>
      ) : (
        <img src={item.url} className={styles.mediaChipImg} draggable={false} />
      )}

      <div className={styles.mediaChipOrder}>{index + 1}</div>

      <button
        type="button"
        className={styles.mediaChipRemove}
        onClick={onToggle}
        onPointerDown={(e) => e.stopPropagation()}
        title={marked ? "Annuler la suppression" : "Marquer pour suppression"}
      >
        ✕
      </button>

      {marked && <div className={styles.mediaChipOverlay} />}
    </div>
  );
}
