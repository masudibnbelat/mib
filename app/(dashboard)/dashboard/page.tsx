"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const page = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  const handleTopics = () => {
    router.push("/dashboard/add-topic");
  };
  const handleArticle = () => {
    router.push("/dashboard/add-article");
  };

  return (
    <div>
      <h2> dashboard page Page: {} </h2>

      <div className="flex justify-around items-center">
        <button
          onClick={handleTopics}
          className="px-6 py-3 bg-(--color-text) border-none outline-none text-(--color-bg) text-sm rounded active:scale-[0.9] transition-all duration-300"
        >
          Add topics
        </button>

        <button
          onClick={handleArticle}
          className="px-6 py-3  bg-(--color-text)  border-none outline-none  text-(--color-bg)  text-sm rounded active:scale-[0.9] transition-all duration-300"
        >
          Add Article
        </button>

        <Link
          href="/dashboard/add-projects"
          className="px-6 py-3  bg-(--color-text)  border-none outline-none  text-(--color-bg)  text-sm rounded active:scale-[0.9] transition-all duration-300"
        >
          Add Projects
        </Link>
        <Link
          href="/"
          className="px-6 py-3  bg-(--color-text)  border-none outline-none  text-(--color-bg)  text-sm rounded active:scale-[0.9] transition-all duration-300"
        >
          Home
        </Link>
      </div>
    </div>
  );
};

export default page;
