export interface WeddingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  copy: string;
  shortTagline?: string;
  shortCopy?: string;
  image?: string;
}

export interface WeddingPhotos {
  couplePortrait: string;
  handsDetail: string;
  carTravel: string;
  templeScene: string;
  memory1?: string;
  memory2?: string;
  memory3?: string;
  memory4?: string;
}

export interface WeddingData {
  id?: string;
  slug: string;
  brideName: string;
  groomName: string;
  monogram: string;
  blessingEyebrow: string;
  weddingDate: string; // ISO string e.g. "2027-02-20T09:15:00+05:30"
  displayDate: string; // e.g. "20 February 2027"
  subheading: string; // e.g. "ARE GETTING MARRIED"
  invitationEyebrow: string; // e.g. "IN THE PRESENCE OF LOVE & TRADITION"
  invitationHeading: string; // e.g. "You're invited"
  invitationSubtitle: string; // e.g. "Together with our families,\nwe invite you to celebrate the wedding of"
  invitationQuote: string; // e.g. "Two hearts. Two families.\nOne beautiful beginning."
  locationLine: string; // e.g. "20 FEBRUARY 2027 · THANJAVUR"
  city: string; // e.g. "Thanjavur, Tamil Nadu"
  venueName: string; // e.g. "The Heritage Courtyard"
  muhurthamTime: string; // e.g. "Muhurtham · 9:15 am – 11:30 am"
  events: WeddingEvent[];
  photos: WeddingPhotos;
  storyIntro: string; // e.g. "Different paths, the same kind of forever."
  finalHeading: string; // e.g. "Our forever begins with you."
  finalSubtext?: string;
  updatedAt?: string;
}
