export const SITE = {
  name: "T. M. Saiful Islam",
  title: "T. M. Saiful Islam — Full-Stack Web Developer & Digital Growth Specialist",
  role: "Full-Stack Web Developer & Digital Growth Specialist",
  description:
    "Portfolio of T. M. Saiful Islam — a full-stack web developer and digital growth specialist building websites, e-commerce experiences, Meta Ads systems and reliable conversion tracking.",
  email: "saifulislamnyt@gmail.com",
  phone: "+8801576483920",
  phoneDisplay: "+880 1576-483920",
  whatsappUrl:
    "https://wa.me/8801576483920?text=Hi%20Saiful%2C%20I%27d%20like%20to%20discuss%20a%20project.",
  whatsappMessage: "Hi Saiful, I'd like to discuss a project.",
  experience: "1.5 years",
  projectsCompleted: "100+",
  languages: "English",
  eyebrow: "WEB DEVELOPMENT · E-COMMERCE · DIGITAL GROWTH",
} as const;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
] as const;
