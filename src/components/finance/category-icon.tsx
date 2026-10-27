import {
  BriefcaseIcon,
  CarIcon,
  ClapperboardIcon,
  FileTextIcon,
  HeartPulseIcon,
  HomeIcon,
  LandmarkIcon,
  RepeatIcon,
  ShoppingCartIcon,
  TagIcon,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  home: HomeIcon,
  "shopping-cart": ShoppingCartIcon,
  car: CarIcon,
  clapperboard: ClapperboardIcon,
  "heart-pulse": HeartPulseIcon,
  landmark: LandmarkIcon,
  repeat: RepeatIcon,
  briefcase: BriefcaseIcon,
  "file-text": FileTextIcon,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? TagIcon;
  return <Icon className={className} />;
}
