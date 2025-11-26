import { useRef, useEffect } from "react";

import VirtualList from "@/components/VirtualList";

interface User {
  id: number;
  name: string;
}

const users: User[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
}));

const VirtualListDemo: React.FC = () => {
  const testRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setTimeout(() => {
      testRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1000);
  }, []);
  return (
    <div>
      <h1 style={{ margin: "32px", fontSize: "24px" }}>scrollIntoView</h1>

      <div
        style={{
          height: 300,
          width: "100%",
          border: "1px solid #ccc",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <p
          ref={testRef}
          style={{
            height: 50,
            width: "100%",
            textAlign: "center",
            backgroundColor: "#f0f0f0",
            position: "absolute",
            top: 0,
            left: 0,
            transform: "translateY(500px)",
          }}
        >
          123
        </p>
      </div>

      <hr />
      <h1 style={{ margin: "32px", fontSize: "24px" }}>虚拟列表</h1>

      <VirtualList
        data={users}
        itemHeight={50}
        height={300}
        renderItem={(user) => (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              backgroundColor: user.id % 2 === 0 ? "#f0f0f0" : "#fff",
            }}
          >
            <span>{user.name}</span>
            <button onClick={() => alert(`点击了 ${user.name}`)}>点击</button>
          </div>
        )}
      />
    </div>
  );
};

export default VirtualListDemo;
