export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  emoji: string;
  gradient: string;
};

export const products: Product[] = [
  {
    id: "aurora-earbuds",
    name: "Aurora Wireless Earbuds",
    tagline: "Immersive sound, all day",
    description:
      "Active noise cancelling earbuds with 32h battery life, wireless charging, and crystal-clear calls. The perfect everyday companion.",
    price: 59.99,
    category: "Audio",
    rating: 4.8,
    emoji: "🎧",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "nimbus-smartwatch",
    name: "Nimbus Smartwatch",
    tagline: "Your health, on your wrist",
    description:
      "Track heart rate, sleep, and workouts with a bright AMOLED display and 7-day battery. Water resistant up to 50m.",
    price: 89.99,
    category: "Wearables",
    rating: 4.6,
    emoji: "⌚",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    id: "lumen-desk-lamp",
    name: "Lumen LED Desk Lamp",
    tagline: "Light that works with you",
    description:
      "Dimmable desk lamp with adjustable color temperature, USB charging port, and touch controls. Reduce eye strain instantly.",
    price: 34.99,
    category: "Home",
    rating: 4.7,
    emoji: "💡",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "terra-water-bottle",
    name: "Terra Insulated Bottle",
    tagline: "Cold for 24h, hot for 12h",
    description:
      "Double-walled stainless steel bottle that keeps drinks at the perfect temperature. Leak-proof and BPA-free, 750ml.",
    price: 24.99,
    category: "Lifestyle",
    rating: 4.9,
    emoji: "🍶",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "pulse-fitness-band",
    name: "Pulse Resistance Band Set",
    tagline: "Your gym, anywhere",
    description:
      "Five stackable resistance bands with door anchor and handles. Up to 150 lbs of resistance for a full-body workout.",
    price: 29.99,
    category: "Fitness",
    rating: 4.5,
    emoji: "🏋️",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "orbit-phone-stand",
    name: "Orbit Magnetic Phone Stand",
    tagline: "Charge, watch, create",
    description:
      "Aluminium magnetic stand with 15W fast wireless charging and adjustable viewing angles. Compatible with modern phones.",
    price: 39.99,
    category: "Accessories",
    rating: 4.4,
    emoji: "📱",
    gradient: "from-fuchsia-500 to-violet-600",
  },
  {
    id: "breeze-mini-fan",
    name: "Breeze Portable Mini Fan",
    tagline: "Stay cool on the go",
    description:
      "Rechargeable handheld fan with three speeds and a foldable base. Whisper-quiet motor and up to 20h runtime.",
    price: 19.99,
    category: "Lifestyle",
    rating: 4.3,
    emoji: "🌀",
    gradient: "from-cyan-400 to-sky-500",
  },
  {
    id: "cosmo-backpack",
    name: "Cosmo Anti-Theft Backpack",
    tagline: "Carry it all, safely",
    description:
      "Water-resistant backpack with hidden zippers, USB charging pass-through, and a padded 15\" laptop compartment.",
    price: 49.99,
    category: "Travel",
    rating: 4.7,
    emoji: "🎒",
    gradient: "from-slate-600 to-gray-800",
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
