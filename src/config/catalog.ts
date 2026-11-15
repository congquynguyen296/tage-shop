import { HeroSlide } from "@/types";

export const NAV_CATEGORIES = [
  "Top",
  "Bottom",
  "Outerwear",
  "New Arrivals",
] as const;

export const SIZE_GROUPS: Array<[string, string[]]> = [
  ["Clothing", ["XS", "S", "M", "L", "XL"]],
  ["Waist (denim & trousers)", ["28", "30", "32", "34", "36"]],
  ["Footwear", ["40", "41", "42", "43", "44"]],
];

export const SORT_OPTIONS: Array<["new" | "lo" | "hi", string]> = [
  ["new", "Newest"],
  ["lo", "Price: low to high"],
  ["hi", "Price: high to low"],
];

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    kicker: "FW26 · Delivery 5",
    titleLine1: "The New",
    titleLine2: "Essentials",
    image: "/images/home/home-header.jpg",
    gradient: "linear-gradient(120deg,#f4f4f4 0%,#e3e3e3 55%,#cfcfcf 130%)",
  },
  {
    id: 2,
    kicker: "Outerwear Edit",
    titleLine1: "Layer",
    titleLine2: "Up",
    image: "/images/home/home-header-1.jpg",
    gradient: "linear-gradient(120deg,#efefef 0%,#dcdcdc 60%,#c3c3c3 130%)",
  },
  {
    id: 3,
    kicker: "Denim Season",
    titleLine1: "Worn In,",
    titleLine2: "Not Out",
    image: "/images/home/home-header-2.jpg",
    gradient: "linear-gradient(120deg,#f2f2f2 0%,#dadde3 60%,#bcc4d0 130%)",
  },
  {
    id: 4,
    kicker: "Tailored Form",
    titleLine1: "Modern",
    titleLine2: "Silhouette",
    image: "/images/home/home-header-3.jpg",
    gradient: "linear-gradient(120deg,#f5f5f5 0%,#e2e2e2 60%,#cacaca 130%)",
  },
  {
    id: 5,
    kicker: "Monochrome Study",
    titleLine1: "Quiet",
    titleLine2: "Refinement",
    image: "/images/home/home-header-4.jpg",
    gradient: "linear-gradient(120deg,#eeeeee 0%,#dbdbdb 60%,#bebebe 130%)",
  },
];
