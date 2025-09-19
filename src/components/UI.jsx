import { atom, useAtom } from "jotai";
import { useEffect, useRef } from "react";

const pictures = [
  "DSC00680",
  "DSC00933",
  "DSC00966",
  "DSC00983",
  "DSC01011",
  "DSC01040",
  "DSC01064",
  // "DSC01071",
  // "DSC01103",
  // "DSC01145",
  // "DSC01420",
  // "DSC01461",
  // "DSC01489",
  // "DSC02031",
  // "DSC02064",
  // "DSC02069",
];

export const pageAtom = atom(0);
export const pages = [
  {
    front: "book-cover",
    back: pictures[0],
  },
];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back",
});

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const autoFlipRef = useRef(null);
  const isAutoFlipping = useRef(false);

  // Auto flip functionality
  useEffect(() => {
    // Bắt đầu auto flip sau 2 giây khi component mount
    const startAutoFlip = () => {
      if (!isAutoFlipping.current) {
        isAutoFlipping.current = true;

        const flipPages = () => {
          setPage((currentPage) => {
            const nextPage = (currentPage + 1) % (pages.length + 1);

            // Nếu đã đến trang cuối, reset về đầu sau 3 giây
            if (nextPage === 0 && currentPage === pages.length) {
              autoFlipRef.current = setTimeout(() => {
                flipPages();
              }, 3000);
              return nextPage;
            }

            // Tiếp tục flip với interval 2.5 giây
            autoFlipRef.current = setTimeout(() => {
              flipPages();
            }, 2500);

            return nextPage;
          });
        };

        // Bắt đầu auto flip sau 2 giây
        autoFlipRef.current = setTimeout(() => {
          flipPages();
        }, 2000);
      }
    };

    startAutoFlip();

    // Cleanup khi component unmount
    return () => {
      if (autoFlipRef.current) {
        clearTimeout(autoFlipRef.current);
      }
      isAutoFlipping.current = false;
    };
  }, []); // Chỉ chạy một lần khi component mount

  // Play audio on page change (re-added as it's part of the book experience)
  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  return (
    <>
      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col"></main>

      <div className="fixed inset-0 flex items-center -rotate-2 select-none hidden">
        <div className="relative">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-8 w-max px-8">
            <h1 className="shrink-0 text-white text-10xl font-black ">
              {"{"}SJCODES{"}"}
            </h1>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              3D Book Slider
            </h2>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              made with React Three Fiber
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              & Three.js
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};
