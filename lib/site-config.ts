import {
  Briefcase,
  Store,
  Search,
  Link2,
  Code,
  Palette,
  Globe,
  type LucideIcon,
} from 'lucide-react';

export const siteConfig = {
  name: 'Yanmife Arayela',
  role: 'UI/UX Designer & Web Developer',
  location: 'Lagos, Nigeria',
  email: 'yanmife.arayela@gmail.com',
  bio: `I'm a UI/UX designer and web developer based in Lagos, Nigeria. I design and build clean, easy-to-use websites and apps that help businesses grow. I care about thoughtful details, accessible interfaces, and getting the fundamentals right.`,
  roles: ['UI/UX Designer', 'Web Developer', 'Data Cleaner'],
  stats: [
    { label: 'Projects completed', value: 24 },
    { label: 'Years learning', value: 3 },
    { label: 'Tools used', value: 12 },
  ],
  cvUrl: '/cv.pdf',
};

export interface SocialLink {
  name: string;
  url: string;
  icon: LucideIcon;
}

export const socialLinks: SocialLink[] = [
  { name: 'Upwork', url: 'https://www.upwork.com/freelancers/~01b19c1bdca34f1237?mp_source=share', icon: Briefcase },
  { name: 'Fiverr', url: 'https://www.fiverr.com/s/Bbbapb5', icon: Store },
  { name: 'Indeed', url: 'https://indeed.com', icon: Search },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/oluwayanmife-arayela-00565b336', icon: Link2 },
  { name: 'GitHub', url: 'https://github.com/Deluxe2186', icon: Code },
  { name: 'Behance', url: 'https://behance.net', icon: Palette },
  { name: 'Dribbble', url: 'https://dribbble.com', icon: Globe },
];

export const navLinks = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
];