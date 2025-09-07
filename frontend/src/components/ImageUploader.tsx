import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../state/toast";

export default function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { show } = useToast();

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    const data = new FormData();
    data.append("file", f);
    try {
      setBusy(true);
      const { data: resp } = await api.post<{ url: string }>(
        "/files/upload",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      onUploaded(resp.url);
      show("Фото загружено", "success");
    } catch (err: any) {
      show(err?.response?.data?.detail || "Ошибка загрузки фото", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="image-uploader">
      <input type="file" accept="image/*" onChange={pick} disabled={busy} />
      {preview && (
        <div className="preview-image">
          <img src={preview} alt="" className="img-fit" />
        </div>
      )}
    </div>
  );
}
