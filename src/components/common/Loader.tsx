import { LoaderCircle } from "lucide-react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center py-10">
      <LoaderCircle className="w-10 h-10 animate-spin text-(--color-text)" />
    </div>
  );
};

export default Loader;
