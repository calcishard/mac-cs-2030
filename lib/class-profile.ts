/** A classmate as shown on the board, in search, and in the profile dialog. */
export type Person = {
  id: string;
  name: string;
  initials: string;
  tagline: string;
  color: string;
  ink: string;
  bio: string;
  project: string;
  interests: string[];
  photo?: string;
  photoAlt?: string;
  photoPosition?: string;
  note?: string;
};

/** A submission as listed on the admin page. */
export type AdminEntry = {
  email: string;
  status: "pending" | "approved";
  showOnBoard: boolean;
  name: string | null;
  note: string | null;
  tagline: string | null;
  bio: string | null;
  project: string | null;
  interests: string[];
  photo?: string;
  photoPosition: string | null;
  createdAt: string;
};
