import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateCapture } from "@/hooks/useCaptures";
import { getUserFacingErrorMessage } from "@/lib/errors";

export function Capture() {
  const [content, setContent] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const createCapture = useCreateCapture();
  const trimmedContent = content.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage("");

    if (!trimmedContent) {
      return;
    }

    try {
      await createCapture.mutateAsync({ content: trimmedContent });
      setContent("");
      setSavedMessage("Saved to inbox.");
    } catch {
      setSavedMessage("");
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Capture</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Drop a text fragment here. Life OS keeps the original intact.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <label className="text-sm font-medium text-card-foreground" htmlFor="capture-content">
            New capture
          </label>
          <textarea
            className="mt-3 min-h-44 w-full resize-none rounded-md border border-input bg-background px-3 py-3 text-base leading-6 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
            id="capture-content"
            onChange={(event) => {
              setContent(event.target.value);
              setSavedMessage("");
            }}
            placeholder="Write a thought, note, memory, task, or detail to keep..."
            value={content}
          />
        </div>

        {createCapture.isError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getUserFacingErrorMessage(createCapture.error, "Unable to save this capture right now.")}
          </p>
        ) : null}

        {savedMessage ? (
          <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {savedMessage}
          </p>
        ) : null}

        <button
          className="min-h-12 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!trimmedContent || createCapture.isPending}
          type="submit"
        >
          {createCapture.isPending ? "Saving..." : "Save capture"}
        </button>
      </form>
    </section>
  );
}
