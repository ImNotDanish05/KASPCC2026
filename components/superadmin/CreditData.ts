export type CreditMember = {
  name: string;
  role: string;
  image: string;
  socials: {
    instagram?: string;
    github?: string;
    youtube?: string;
  };
};

const CREDITS_IMAGE_VERSION = "2026-05-12-v2";

export const originalDevelopers20252026: CreditMember[] = [
  {
    name: "Danish Mahdi",
    role: "Developer",
    image: `/images/credits/danish.png?v=${CREDITS_IMAGE_VERSION}`,
    socials: {
      instagram: "https://www.instagram.com/danish_mahdi05/",
      github: "https://github.com/ImNotDanish05",
      youtube: "https://www.youtube.com/@danish0537",
    },
  },
  {
    name: "Abimanyu Gilar",
    role: "Developer",
    image: `/images/credits/abi.png?v=${CREDITS_IMAGE_VERSION}`,
    socials: {
      instagram: "https://www.instagram.com/gira.ichi/",
      github: "https://github.com/AbimanyuGilar",
    },
  },
  {
    name: "Alfin Rozzaq Nirwana",
    role: "Infrastructure",
    image: `/images/credits/alfin.png?v=${CREDITS_IMAGE_VERSION}`,
    socials: {
      instagram: "https://www.instagram.com/algaray_02/",
      github: "https://github.com/Algaray02",
    },
  },
];
