"use client";

import { useState } from "react";
import { developers, type SiteDeveloper } from "@/lib/developers";
import styles from "./about-developers.module.css";

function DeveloperPortrait({ developer }: { developer: SiteDeveloper }) {
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const initials = developer.name.trim().split(/\s+/)
    .filter(Boolean).map(part => Array.from(part)[0]).slice(0, 2).join("");

  return <div className={styles.portrait}>
    {developer.photo && failedPhoto !== developer.photo
      ? <img
          src={developer.photo}
          alt=""
          width={160}
          height={160}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: developer.photoPosition || "50% 50%" }}
          onError={() => setFailedPhoto(developer.photo)}
        />
      : <span className={styles.initials} aria-hidden="true">{initials}</span>}
  </div>;
}

export function AboutDevelopers() {
  if (!developers.length) return null;

  return <section className={styles.credits} aria-labelledby="about-developers-heading">
    <h2 id="about-developers-heading" className={styles.heading}>made by</h2>
    <ul className={styles.list}>
      {developers.map(developer => <li key={developer.id} className={styles.developer}>
        <figure className={styles.card}>
          <DeveloperPortrait developer={developer} />
          <figcaption className={styles.name}>{developer.name}</figcaption>
        </figure>
      </li>)}
    </ul>
  </section>;
}
