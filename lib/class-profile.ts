export type Chapter = {id:string;category:string;question:string;bars:{label:string;count:number}[];statEyebrow:string;statValue:number;statLabel:string;statNote:string;donutCount:number;donutLabel:string};

export type Person = {id:string;name:string;initials:string;interest:string;tagline:string;color:string;ink:string;bio:string;project:string;offline:string;photo?:string;photoAlt?:string;photoPosition?:string;note?:string};

// Example content only. Replace with the details your classmates provide.
export const people: Person[] = [
  {
    "id": "alex",
    "name": "Alex C.",
    "initials": "ac",
    "interest": "THE BUILDER",
    "tagline": "currently fighting with CSS",
    "color": "#e7b345",
    "ink": "#4a231c",
    "bio": "Usually building something small, then making it unnecessarily complicated. Up for a hackathon or a walk between classes.",
    "project": "a map of quiet study spots",
    "offline": "pickup basketball + whatever album is on repeat",
    "photo": "/photos/desk.jpg",
    "photoAlt": "Sample interest photo of a laptop, notebook and camera on a desk",
    "photoPosition": "30% 50%",
    "note": "one more side project"
  },
  {
    "id": "maya",
    "name": "Maya P.",
    "initials": "mp",
    "interest": "THE CREATIVE",
    "tagline": "usually has a camera",
    "color": "#c2cedb",
    "ink": "#263b53",
    "bio": "Into design, little web experiments, and taking too many photos. Still figuring out which part of CS feels most like me.",
    "project": "a sketchbook with little animations",
    "offline": "film photography, drawing, finding new music",
    "photo": "/photos/camera.jpg",
    "photoAlt": "Sample interest photo of an analog camera on a beach",
    "photoPosition": "50% 60%",
    "note": "taking the scenic route"
  },
  {
    "id": "noah",
    "name": "Noah L.",
    "initials": "nl",
    "interest": "THE EXPLORER",
    "tagline": "i take the long way home",
    "color": "#d9cde1",
    "ink": "#52365e",
    "bio": "Trying a bit of everything. I like puzzle games, learning from people, and plans that end up outdoors.",
    "project": "a tiny daily puzzle game",
    "offline": "hikes, board games, cooking experiments",
    "photo": "/photos/trail.jpg",
    "photoAlt": "Sample interest photo of backpackers walking along a trail",
    "photoPosition": "40% 60%",
    "note": "back in a bit"
  },
  {
    "id": "priya",
    "name": "Priya S.",
    "initials": "ps",
    "interest": "THE PROBLEM SOLVER",
    "tagline": "always down for badminton",
    "color": "#accabf",
    "ink": "#234a3c",
    "bio": "The person who keeps asking why until it clicks. Would love to make learning new things a little less intimidating.",
    "project": "a visual guide to beginner programming",
    "offline": "badminton, mystery books, trying new recipes",
    "photo": "/campus.jpg",
    "photoAlt": "McMaster University Hall, used as a sample profile interest photo",
    "photoPosition": "45% 50%",
    "note": "see you around campus"
  },
  {
    "id": "sam",
    "name": "Sam R.",
    "initials": "sr",
    "interest": "THE TINKERER",
    "tagline": "probably taking something apart",
    "color": "#c57866",
    "ink": "#401e1c",
    "bio": "I learn by making things, breaking them, and trying again. There is usually a project on my desk that is almost finished.",
    "project": "a dashboard for a little weather sensor",
    "offline": "guitar, cycling, old electronics",
    "photo": "/photos/desk.jpg",
    "photoAlt": "Sample interest photo of electronics and notebooks on a desk",
    "photoPosition": "80% 75%",
    "note": "it worked yesterday"
  },
  {
    "id": "jamie",
    "name": "Jamie K.",
    "initials": "jk",
    "interest": "THE CONNECTOR",
    "tagline": "bringing the card games",
    "color": "#d7d4a8",
    "ink": "#45451f",
    "bio": "I like making things with other people. If you have a half-formed idea and need someone to bounce it around with, same.",
    "project": "a board for finding project teammates",
    "offline": "volleyball, volunteering, board-game nights",
    "photo": "/photos/trail.jpg",
    "photoAlt": "Sample interest photo of friends hiking outdoors",
    "photoPosition": "85% 40%",
    "note": "better with company"
  }
];

// Fictional survey results. No real responses have been collected.
export const chapters: Chapter[] = [
  {
    "id": "before",
    "category": "",
    "question": "Where did we call home?",
    "bars": [
      {
        "label": "Greater Toronto Area",
        "count": 22
      },
      {
        "label": "Hamilton & Halton",
        "count": 12
      },
      {
        "label": "Kitchener–Waterloo",
        "count": 5
      },
      {
        "label": "Ottawa",
        "count": 4
      },
      {
        "label": "Somewhere else",
        "count": 5
      }
    ],
    "statEyebrow": "BEFORE OUR FIRST LECTURE,",
    "statValue": 34,
    "statLabel": "had tried coding before Mac.",
    "statNote": "Different starting points. Plenty to learn from each other.",
    "donutCount": 34,
    "donutLabel": "New to Hamilton"
  },
  {
    "id": "academics",
    "category": "",
    "question": "What are we curious about?",
    "bars": [
      {
        "label": "Software development",
        "count": 18
      },
      {
        "label": "Artificial intelligence",
        "count": 12
      },
      {
        "label": "Cybersecurity",
        "count": 7
      },
      {
        "label": "Game development",
        "count": 6
      },
      {
        "label": "Still exploring",
        "count": 5
      }
    ],
    "statEyebrow": "out of all of our learning styles,",
    "statValue": 28,
    "statLabel": "learn best by building something.",
    "statNote": "A little theory, a little trial and error, a lot of tabs open.",
    "donutCount": 30,
    "donutLabel": "Prefer studying together"
  },
  {
    "id": "life",
    "category": "",
    "question": "What happens when we log off?",
    "bars": [
      {
        "label": "Gaming",
        "count": 14
      },
      {
        "label": "Sports & the outdoors",
        "count": 11
      },
      {
        "label": "Music",
        "count": 10
      },
      {
        "label": "Reading",
        "count": 7
      },
      {
        "label": "Art & creating",
        "count": 6
      }
    ],
    "statEyebrow": "even though we all have 8:30 am lectures, only",
    "statValue": 19,
    "statLabel": "would call themselves morning people.",
    "statNote": "The rest of this fictional class would like five more minutes.",
    "donutCount": 36,
    "donutLabel": "Are in a club or team"
  }
];
