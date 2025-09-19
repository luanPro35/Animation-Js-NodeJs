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

  // Stop auto flip when user interacts
  const handleManualPageChange = (newPage) => {
    // Dừng auto flip khi user click
    if (autoFlipRef.current) {
      clearTimeout(autoFlipRef.current);
    }
    isAutoFlipping.current = false;
    setPage(newPage);
  };

  const onNextPage = () => {
    if (page < pages.length - 1) {
      handleManualPageChange(page + 1);
    }
  };

  const onPrevPage = () => {
    if (page > -1) {
      handleManualPageChange(page - 1);
    }
  };

  // Play audio on page change
  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-center p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {pages.map((_, index) => (
              <div
                key={index}
                className={`w-6 h-1 rounded-full cursor-pointer ${
                  index === page ? "bg-white" : "bg-gray-500"
                }`}
                onClick={() => handleManualPageChange(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
        <a className="pointer-events-auto mt-10 ml-10" href="/">
          <span className="text-white font-bold">
            <span className="text-[#5a47ce]">{"{"} </span>SJCODES
            <span className="text-[#5a47ce]"> {"}"}</span>
          </span>
        </a>
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
            {[...pages].map((_, index) => (
              <button
                key={index}
                className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                  index === page
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white"
                }`}
                onClick={() => handleManualPageChange(index)}
              >
                {index === 0 ? "Cover" : `Page ${index}`}
              </button>
            ))}
            <button
              className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                page === pages.length
                  ? "bg-white/90 text-black"
                  : "bg-black/30 text-white"
              }`}
              onClick={() => handleManualPageChange(pages.length)}
            >
              Back Cover
            </button>
          </div>
        </div>

        {/* Auto flip control */}
        <div className="pointer-events-auto fixed top-10 right-10 flex gap-2">
          <button
            className="bg-black/30 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm border border-transparent hover:border-white transition-all"
            onClick={() => {
              if (autoFlipRef.current) {
                clearTimeout(autoFlipRef.current);
              }
              isAutoFlipping.current = false;
            }}
          >
            Stop Auto
          </button>
          <button
            className="bg-black/30 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm border border-transparent hover:border-white transition-all"
            onClick={() => {
              if (autoFlipRef.current) {
                clearTimeout(autoFlipRef.current);
              }
              isAutoFlipping.current = true;

              const flipPages = () => {
                setPage((currentPage) => {
                  const nextPage = (currentPage + 1) % (pages.length + 1);

                  if (nextPage === 0 && currentPage === pages.length) {
                    autoFlipRef.current = setTimeout(() => {
                      flipPages();
                    }, 50);
                    return nextPage;
                  }

                  autoFlipRef.current = setTimeout(() => {
                    flipPages();
                  }, 30);

                  return nextPage;
                });
              };

              flipPages();
            }}
          >
            Start Auto
          </button>
        </div>
      </main>

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
