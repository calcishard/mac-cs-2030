export type SiteDeveloper = {
  id: string;
  name: string;
  photo?: string;
  photoPosition?: string;
};

/** Add portrait files to public/developers, then set each person's photo path. */
export const developers: readonly SiteDeveloper[] = [
  {
    id: "jason-tran",
    name: "Jason Tran",
    photo: "jason-tran.jpg",
  },
  {
    id: "naman-sonawane",
    name: "Naman Sonawane",
    photo: "naman-sonawane.jpg",
  },
];
