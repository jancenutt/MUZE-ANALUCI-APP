// Reads a local audio file's length so an attached master can show its duration immediately.
export function readAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const seconds = audio.duration;
      URL.revokeObjectURL(url);
      resolve(
        Number.isFinite(seconds)
          ? `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
              .toString()
              .padStart(2, "0")}`
          : ""
      );
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    audio.src = url;
  });
}