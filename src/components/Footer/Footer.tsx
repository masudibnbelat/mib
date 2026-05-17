import Link from "next/link";
import SocialMedia from "./SocialMedia";

const Footer = () => {
  return (
    <footer className="mb-16 lg:my-5" id="contact">
      <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-5  border-t border-(--color-active-bg) py-5 px-6">
        <SocialMedia />

        <p className="text-[0.8rem] sm:text-[0.9rem] text-gray-600 rubik-regular whitespace-nowrap">
          &copy; 2021 All Rights Reserved by{" "}
          <Link href="/dashboard" className="font-bold">
            Masud ibn Belat
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
