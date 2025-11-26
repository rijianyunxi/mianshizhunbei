import { useEffect, useRef } from "react";
import type { FC } from "react";

const IntersectionObserverDemo: FC = () => {
  const imgRef = useRef<HTMLImageElement[]>([]);
  const imgUrls = [
    "https://www.dmoe.cc/random.php?a=1",
    "https://www.dmoe.cc/random.php?b=2",
    "https://www.dmoe.cc/random.php?c=3",
    "https://www.dmoe.cc/random.php?d=4",
    "https://www.dmoe.cc/random.php?e=5",
  ];
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
           const img = entry.target as HTMLImageElement;
           img.src = img.dataset.src || "";
           observer.unobserve(img);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );
    imgRef.current.forEach((el) => {
      observer.observe(el);
    });
  }, []);

  return (
    <>
      <div
        style={{
          height: "300px",
          width: "300px",
          border: "1px solid #ccc",
          overflowY: "auto",
        }}
      >
        {imgUrls.map((url, index) => (
          <img
            key={index}
            ref={(el) => {
              if (el) imgRef.current[index] = el;
            }}
            style={{ width: "300px", height: "200px",margin: "16px"  }}
            src="https://yaohuo.me/XinZhang/upload/1000/1000_0700400.gif"
            data-src={url}
            alt=""
          />
        ))}
      </div>
    </>
  );
};

export default IntersectionObserverDemo;
