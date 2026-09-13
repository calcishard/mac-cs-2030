"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, PenLine } from "lucide-react";
import type { PhotoPosition } from "@/components/join/polaroid-preview";

const ease = [0.22, 1, 0.36, 1] as const;

type Props = { showOnBoard: boolean; name: string; note: string; photoUrl?: string; position: PhotoPosition };

/** The polaroid slides out of the camera, develops, then settles at a tilt. */
export function JoinSuccess({ showOnBoard, name, note, photoUrl, position }: Props) {
  return <div className="join-success">
    {showOnBoard
      ? <div className="success-stage" aria-hidden="true">
          <div className="camera-slot" />
          <motion.div className="polaroid success-polaroid"
            initial={{ y: "-100%", clipPath: "inset(100% -30% -30% -30%)", rotate: 0 }}
            animate={{ y: "0%", clipPath: "inset(0% -30% -30% -30%)", rotate: -4 }}
            transition={{
              y: { duration: 1.4, ease },
              clipPath: { duration: 1.4, ease },
              rotate: { delay: 1.45, type: "spring", stiffness: 120, damping: 7 },
            }}>
            <span className="photo-window">
              {photoUrl && <motion.img src={photoUrl} alt="" style={{ objectPosition: `${position.x}% ${position.y}%` }}
                initial={{ filter: "blur(18px) sepia(1) brightness(1.9)", opacity: 0.2 }}
                animate={{ filter: "blur(0px) sepia(0) brightness(1)", opacity: 1 }}
                transition={{ delay: 1.1, duration: 2.4, ease }} />}
            </span>
            <span className="photo-caption"><span className="photo-name">{name.toLowerCase()}</span></span>
            <span className="photo-note">{note}</span>
          </motion.div>
        </div>
      : <motion.div className="counted-stamp" aria-hidden="true"
          initial={{ scale: 2.4, opacity: 0, rotate: 8 }} animate={{ scale: 1, opacity: 1, rotate: -6 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}>counted!</motion.div>}
    <motion.div className="success-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: showOnBoard ? 1.7 : 0.55, duration: 0.6, ease }}>
      {showOnBoard && <p className="handwritten success-note">pinned for review</p>}
      <h1>you’re in.</h1>
      <p>{showOnBoard ? "you’ll show up on the board once approved." : "your answers will show up in the charts."}</p>
      <div className="success-actions">
        <Link className="join-button primary" href="/"><ArrowLeft size={16} aria-hidden="true" /> back to the board</Link>
        {showOnBoard && <Link className="join-button" href="/join/edit"><PenLine size={16} aria-hidden="true" /> edit your polaroid</Link>}
      </div>
    </motion.div>
  </div>;
}
