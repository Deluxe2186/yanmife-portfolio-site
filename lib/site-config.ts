import type { IconType } from 'react-icons';
import { SiGithub, SiUpwork } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';
import { FiverrWordmark } from '@/lib/brand-icons';

export const siteConfig = {
  name: 'Yanmife Arayela',
  role: 'UI/UX Designer & Web Developer',
  location: 'Lagos, Nigeria',
  email: 'yanmife.arayela@gmail.com',
  bio: `I'm a UI/UX designer and web developer based in Lagos, Nigeria. I design in Figma and build with Next.js and CSS. I like clear layouts and small details done right, and I want what I build to be easy for anyone to use.`,
  roles: ['UI/UX Designer', 'Web Developer', '3D Artist'],
  stats: [
    { label: 'Projects completed', value: 6 },
    { label: 'Years learning', value: 3 },
    { label: 'Tools used', value: 7 },
  ],
};

export interface SocialLink {
  name: string;
  url: string;
  icon: IconType;
  /** The icon is a full wordmark, so it is shown wide and without a text label. */
  wordmark?: boolean;
}

export const socialLinks: SocialLink[] = [
  { name: 'Upwork', url: 'https://www.upwork.com/freelancers/~01b19c1bdca34f1237?mp_source=share', icon: SiUpwork },
  { name: 'Fiverr', url: 'https://www.fiverr.com/s/Bbbapb5', icon: FiverrWordmark, wordmark: true },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/oluwayanmife-arayela-00565b336', icon: FaLinkedin },
  { name: 'GitHub', url: 'https://github.com/Deluxe2186', icon: SiGithub },
];

export const navLinks = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
];