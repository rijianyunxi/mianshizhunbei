import { useEffect, useState } from "react";
import type { FC } from "react";
import { Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import http from "@/utils/http";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

type UserType = {
  id: string;
  username: string;
  nickname: string;
  gender: string;
};

const UserTable: FC = () => {
  const [userList, setUserList] = useState<UserType[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  console.log('selectedKeys',selectedKeys);
  

  const rowSelection: TableRowSelection<UserType> = {
    type: "checkbox",
    onChange: (keys) => {
      setSelectedKeys(keys);
    },
  };

  const columns: TableColumnsType<UserType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "姓名",
      dataIndex: "nickname",
      key: "nickname",
    },
    {
      title: "性别",
      dataIndex: "gender",
      key: "gender",
    },
  ];

  useEffect(() => {
    console.log('mount');
    
    http({
      url: "/user/list",
      method: "post",
      data: {
        page: 1,
        size: 10,
      }
    }).then((res) => {
      setUserList(res.data);
    });
  }, []);

  return (
    <div style={{ background: "#fff", padding: "16px",maxHeight:"100vh",overflowY:"auto" }}>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={userList}
        rowKey="id"
        scroll={{ y: '40vh' }}
      />
    </div>
  );
};

export default UserTable;
