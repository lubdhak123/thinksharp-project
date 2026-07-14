"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function ApplicationQrCode() {
  const [qrUrl, setQrUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/volunteer-apply`;
    setApplicationUrl(url);

    QRCode.toDataURL(url, {
      margin: 1,
      width: 176,
      color: {
        dark: "#1A1A1A",
        light: "#FFFFFF",
      },
    }).then(setQrUrl).catch(() => setQrUrl(""));
  }, []);

  return (
    <aside className="border border-border bg-white p-5 font-display">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-44 w-44 shrink-0 place-items-center border border-border bg-paper">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR code for the ThinkSharp application form" className="h-40 w-40" />
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-mist">QR</span>
          )}
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">QR Access</p>
          <h2 className="text-xl font-bold text-ink">Share the public application form</h2>
          <p className="text-sm leading-relaxed text-mist">
            Use this QR code on posters, WhatsApp, or event desks. It opens the same public registration page.
          </p>
          {applicationUrl && (
            <p className="break-all text-xs font-semibold text-ink">{applicationUrl}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
