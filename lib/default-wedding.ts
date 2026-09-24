import { WeddingData } from "./types/wedding";

export const defaultWeddingData: WeddingData = {
  slug: "ananya-karthik",
  brideName: "Ananya",
  groomName: "Karthik",
  monogram: "a&k",
  blessingEyebrow: "WITH THE BLESSINGS OF OUR FAMILIES",
  weddingDate: "2027-02-20T09:15:00+05:30",
  displayDate: "20 February 2027",
  subheading: "ARE GETTING MARRIED",
  invitationEyebrow: "IN THE PRESENCE OF LOVE & TRADITION",
  invitationHeading: "You're invited",
  invitationSubtitle: "Together with our families,\nwe invite you to celebrate the wedding of",
  invitationQuote: "Two hearts. Two families.\nOne beautiful beginning.",
  locationLine: "20 FEBRUARY 2027 · THANJAVUR",
  city: "Thanjavur, Tamil Nadu",
  venueName: "The Heritage Courtyard",
  muhurthamTime: "Muhurtham · 9:15 am – 11:30 am",
  storyIntro: "Different paths, the same kind of forever.",
  finalHeading: "Our forever begins with you.",
  events: [
    {
      id: "event-1",
      title: "Mehendi afternoon",
      date: "Friday, 19 February 2027",
      time: "4:00 pm onwards",
      venue: "The Garden Courtyard · Thanjavur",
      copy: "An afternoon of henna, familiar songs, and the people we call home. Come dressed in colour and stay for the laughter.",
      shortTagline: "A LITTLE COLOUR. A LOT OF JOY.",
      shortCopy: "Henna, laughter and all the little joys before forever.",
      image: "/images/couple.webp"
    },
    {
      id: "event-2",
      title: "Sangeet evening",
      date: "Friday, 19 February 2027",
      time: "7:00 pm onwards",
      venue: "The Celebration Hall · Thanjavur",
      copy: "An evening of music, dancing, and two families becoming one. Bring a favourite song and your happiest dancing shoes.",
      shortTagline: "OUR FAMILIES. OUR FAVOURITE SONGS.",
      shortCopy: "A night of music, a little magic, and a whole lot of love.",
      image: "/images/hands.webp"
    },
    {
      id: "event-3",
      title: "The wedding ceremony",
      date: "Saturday, 20 February 2027",
      time: "9:15 am – 11:30 am · IST",
      venue: "The Heritage Courtyard · Thanjavur",
      copy: "With the blessings of our families, join us for our wedding ceremony and a traditional South Indian lunch. Reception follows at 6:30 pm.",
      shortTagline: "WHERE OUR FOREVER BEGINS",
      shortCopy: "Sacred rites, timeless traditions, and lifelong promises.",
      image: "/images/temple.webp"
    }
  ],
  photos: {
    couplePortrait: "/images/couple.webp",
    handsDetail: "/images/hands.webp",
    carTravel: "/images/car.webp",
    templeScene: "/images/temple.webp",
    memory1: "/images/couple.webp",
    memory2: "/images/hands.webp",
    memory3: "/images/car.webp",
    memory4: "/images/temple.webp"
  }
};
