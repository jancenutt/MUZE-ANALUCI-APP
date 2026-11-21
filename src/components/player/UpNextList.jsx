import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, Repeat, Repeat1, Shuffle } from "lucide-react";
import QueueRow from "@/components/player/QueueRow";
import { usePlayer } from "@/lib/player";

// The Up Next panel: the list shown here is the play order itself. Shuffle rewrites it,
// a drag rewrites it, and the playing track is pinned to the top either way.
export default function UpNextList() {
  const {
    queue,
    queueIndex,
    current,
    playing,
    removeFromQueue,
    clearQueue,
    playFrom,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    reorderQueue,
  } = usePlayer();

  const playingId = queue[queueIndex]?.id ?? current?.id;
  const playingPos = queue.findIndex((track) => track.id === playingId);
  const pinned = playingPos >= 0 ? queue[playingPos] : null;
  const rest = queue
    .map((track, index) => ({ track, index }))
    .filter((row) => row.index !== playingPos);

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const order = rest.map((row) => row.track);
    const [moved] = order.splice(result.source.index, 1);
    order.splice(result.destination.index, 0, moved);
    const nextList = [...queue];
    rest.forEach((row, position) => {
      nextList[row.index] = order[position];
    });
    reorderQueue(nextList);
  };

  const repeatLabel =
    repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off";

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleShuffle}
          aria-pressed={shuffle}
          className={`flex min-h-[40px] items-center gap-1.5 rounded-sm border px-3 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
            shuffle
              ? "border-amber/50 bg-amber/10 text-amber"
              : "border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shuffle className="h-3 w-3" /> Shuffle
        </button>
        <button
          onClick={cycleRepeat}
          aria-label={repeatLabel}
          className={`flex min-h-[40px] items-center gap-1.5 rounded-sm border px-3 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
            repeat !== "off"
              ? "border-amber/50 bg-amber/10 text-amber"
              : "border-white/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          {repeat === "one" ? <Repeat1 className="h-3 w-3" /> : <Repeat className="h-3 w-3" />}
          {repeatLabel}
        </button>
        {queue.length > 1 ? (
          <button
            onClick={clearQueue}
            className="ml-auto font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70 hover:text-amber"
          >
            Clear
          </button>
        ) : null}
      </div>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {queue.length} track{queue.length === 1 ? "" : "s"}
        {current?.title ? ` · ${current.title}` : ""}
      </p>

      {queue.length === 0 ? (
        <p className="px-2 py-12 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
          Nothing queued yet — add an album, a song or a playlist and it lands here
        </p>
      ) : (
        <div className="mt-1">
          {pinned ? (
            <QueueRow
              track={pinned}
              isCurrent
              isPlaying={playing}
              shuffleOn={shuffle}
              onPlay={() => playFrom(queue, playingPos)}
            />
          ) : null}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="up-next">
              {(dropProvided) => (
                <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                  {rest.map((row, position) => (
                    <Draggable
                      key={`${row.track.id}-${row.index}`}
                      draggableId={`${row.track.id}-${row.index}`}
                      index={position}
                    >
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={snapshot.isDragging ? "bg-panel shadow-lg" : ""}
                        >
                          <QueueRow
                            track={row.track}
                            position={position + 1}
                            isPlaying={playing}
                            shuffleOn={shuffle}
                            onPlay={() => playFrom(queue, row.index)}
                            onRemove={() => removeFromQueue(row.index)}
                            dragHandle={
                              <span
                                {...dragProvided.dragHandleProps}
                                aria-label={`Reorder ${row.track.title}`}
                                className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 hover:text-amber"
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                            }
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}