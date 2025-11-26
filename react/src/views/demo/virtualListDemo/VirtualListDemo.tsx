import React from "react";
import VirtualList from "@/components/VirtualList";

interface User {
  id: number;
  name: string;
}

const users: User[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `用户 ${i}`,
}));

const test = (
  <>
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
        style={{
          height: 50,
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
  </>
);

const VirtualListDemo: React.FC = () => {
  return (
    <div>
      <h1 style={{ margin: "32px",fontSize: "24px" }}>虚拟列表</h1>
      {test}
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
