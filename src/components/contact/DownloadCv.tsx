"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site";

export function DownloadCv() {
  const [noteVisible, setNoteVisible] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="sr-only">
        The CV file is not hosted on this site yet. Activating the button explains how to request
        it by email.
      </p>
      <button
        type="button"
        className="btn-ghost"
        aria-expanded={noteVisible}
        onClick={() => setNoteVisible((visible) => !visible)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download CV
      </button>
      {noteVisible ? (
        <p
          id="download-cv-note"
          role="status"
          className="max-w-sm text-sm leading-relaxed text-dim"
        >
          The CV PDF hasn&apos;t been uploaded yet — email{" "}
          <a
            href={`mailto:${SITE.email}`}
            className="text-accent underline underline-offset-4"
          >
            {SITE.email}
          </a>{" "}
          and I&apos;ll send it straight over.
        </p>
      ) : null}
    </div>
  );
}
