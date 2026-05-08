import React from "react";

import { IoMdMail } from "react-icons/io";
import {
  FaDiscord,
  FaFacebook,
  FaGithub,
  FaLinkedinIn,
  FaTelegram,
  FaWhatsapp,
} from "react-icons/fa";
import Link from "next/link";

interface SocialItem {
  key: string;
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  color: string;
  link: string;
}

const socials: SocialItem[] = [
  {
    key: "facebook",
    Icon: FaFacebook,
    name: "Facebook",
    color: "#1877f2",
    link: "/",
  },
  {
    key: "whatsapp",
    Icon: FaWhatsapp,
    name: "Whatsapp",
    color: "#25d366",
    link: "/",
  },
  {
    key: "telegram",
    Icon: FaTelegram,
    name: "Telegram",
    color: "#24a1de",
    link: "/",
  },
  {
    key: "discord",
    Icon: FaDiscord,
    name: "Discord",
    color: "#5865f2",
    link: "/",
  },
  {
    key: "linkedin",
    Icon: FaLinkedinIn,
    name: "LinkedIn",
    color: "#0a66c2",
    link: "/",
  },
  {
    key: "github",
    Icon: FaGithub,
    name: "Github",
    color: "#333333",
    link: "/",
  },
  { key: "email", Icon: IoMdMail, name: "e-Mail", color: "#ea4335", link: "/" },
];

const SocialButton: React.FC<{ item: SocialItem }> = ({ item }) => (
  <Link href={item.link}>
    <button
      className="group flex items-center justify-start w-10 h-10 md:w-11.25 md:h-11.25 border-none rounded-full cursor-pointer relative overflow-hidden transition-all duration-300 shadow-[1px_1px_5px_rgba(0,0,0,0.2)] md:shadow-[2px_2px_10px_rgba(0,0,0,0.2)] hover:w-30 md:hover:w-33.75 lg:hover:w-37.5 hover:rounded-[30px] md:hover:rounded-[40px] bg-(--color) active:translate-x-0.5 active:translate-y-0.5"
      style={
        { "--color": item.color } as React.CSSProperties & { "--color": string }
      }
    >
      <div className="w-full transition-all duration-300 flex items-center justify-center group-hover:w-[30%] group-hover:pl-2 md:group-hover:pl-2.5 relative z-10">
        <item.Icon className="w-5 h-5 md:w-6.25 md:h-6.25 group-hover:w-5 md:group-hover:w-6.25 text-[#E9EBED]" />
      </div>
      <div className="absolute right-0 w-0 opacity-0 text-white text-base md:text-lg font-semibold transition-all duration-300 group-hover:opacity-100 group-hover:w-[70%] pr-2 md:group-hover:pr-2.5 whitespace-nowrap">
        {item.name}
      </div>
    </button>
  </Link>
);

const Social: React.FC = () => (
  <div className="flex flex-wrap items-center justify-center gap-2 p-4 md:p-8 w-full mx-auto">
    {socials.map((item) => (
      <SocialButton key={item.key} item={item} />
    ))}
  </div>
);

export default React.memo(Social);
