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
  },
  {
    "id": "alex-w",
    "name": "Alex W.",
    "initials": "aw",
    "interest": "THE GAME MAKER",
    "tagline": "yes, there is a jump button",
    "color": "#a7bfd6",
    "ink": "#26384b",
    "bio": "Making a platformer with a friend. We have one level and about twelve ideas for the soundtrack. I also keep a spreadsheet of games I swear I will finish.",
    "project": "a couch co-op game about lost robots",
    "offline": "table tennis, pixel art, movie nights",
    "photo": "/photos/desk.jpg",
    "photoAlt": "Sample interest photo of a workspace for making games",
    "photoPosition": "65% 45%",
    "note": "different alex, same deadline"
  },
  {
    "id": "leila",
    "name": "Leila A.",
    "initials": "la",
    "interest": "THE SKETCHBOOK KEEPER",
    "tagline": "there is a doodle in the margin",
    "color": "#deb8bd",
    "ink": "#593540",
    "bio": "My lecture notes slowly turn into drawings. Learning front-end development so I can put some of those drawings on a screen and make them move.",
    "project": "a little website for trading book recommendations",
    "offline": "watercolours, library trips, baking for friends",
    "note": "saved you a bookmark"
  },
  {
    "id": "ethan",
    "name": "Ethan D.",
    "initials": "ed",
    "interest": "THE MUSIC PERSON",
    "tagline": "making the playlist for the walk",
    "color": "#b3c5a0",
    "ink": "#35452b",
    "bio": "I play bass and record song ideas on my phone before I forget them. Got into coding after trying to make a practice timer that would stop interrupting the chorus.",
    "project": "a practice log for learning an instrument",
    "offline": "bass guitar, soccer, browsing record shops",
    "photo": "/campus.jpg",
    "photoAlt": "McMaster University Hall, used as a sample campus interest photo",
    "photoPosition": "70% 55%",
    "note": "headphones probably on"
  },
  {
    "id": "zoe",
    "name": "Zoe M.",
    "initials": "zm",
    "interest": "THE EARLY BIRD",
    "tagline": "found another trail",
    "color": "#e1c29c",
    "ink": "#56412c",
    "bio": "Usually the one suggesting we go outside between study sessions. I like maps, birdwatching, and figuring out where a bus route actually goes.",
    "project": "a map of beginner-friendly walks around Hamilton",
    "offline": "hiking, birdwatching, packing too many snacks",
    "photo": "/photos/trail.jpg",
    "photoAlt": "Sample interest photo of a hiking trail",
    "photoPosition": "15% 65%",
    "note": "meet at the bus stop"
  },
  {
    "id": "daniel",
    "name": "Daniel T.",
    "initials": "dt",
    "interest": "THE PUZZLE PERSON",
    "tagline": "give me five more minutes",
    "color": "#c4b5d6",
    "ink": "#473356",
    "bio": "I bring a deck of cards almost everywhere and take escape rooms a little too seriously. Still deciding whether I enjoy solving a bug or finally closing the laptop more.",
    "project": "a daily logic puzzle to send to friends",
    "offline": "chess, cooking dumplings, escape rooms",
    "note": "i think i have a theory"
  },
  {
    "id": "rowan",
    "name": "Rowan B.",
    "initials": "rb",
    "interest": "THE PHOTO FRIEND",
    "tagline": "wait, the light is really nice",
    "color": "#9ebfbd",
    "ink": "#294c4a",
    "bio": "Taking photos of ordinary things and forgetting to sort them afterwards. Hoping a CS degree will help with at least the sorting part. Always happy to join a badminton game.",
    "project": "a photo diary with one picture per day",
    "offline": "photography, badminton, trying new noodle places",
    "photo": "/photos/camera.jpg",
    "photoAlt": "Sample interest photo of a camera outdoors",
    "photoPosition": "25% 50%",
    "note": "sent you the photos"
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
