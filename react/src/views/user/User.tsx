import {useState} from "react";
import type { FC } from "react";
import { Input, Form, Select, Button } from "antd";
import BaseTable from "@/components/BaseTable";
// import UserTable from "./UserTable";

type FieldType = {
  username?: string;
  password?: string;
  gender?: string;
};

type UserType = {
  id: string;
  username: string;
  nickname: string;
  gender: string;
};

const User: FC = () => {
  const [params, setParams] = useState<FieldType>({});
  const [form] = Form.useForm();
  const onFinish = (values: FieldType) => {
    console.log(values);
    setParams(values);
  };

  return (
    <>
      <div
        className="query-box"
        style={{ background: "#fff", padding: "16px",marginBottom: "16px" }}
      >
        <Form
          onFinish={onFinish}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          form={form}
          layout="inline"
        >
          <Form.Item
            name="username"
            label="用户名"
          >
            <Input placeholder="请输入..." />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="姓名"
          >
            <Input placeholder="请输入..." />
          </Form.Item>
          <Form.Item
            style={{ width: "240px" }}
            name="gender"
            label="性别"
          >
            <Select
              allowClear
              placeholder="请选择..."
              options={[
                { label: "全部", value: "" },
                { label: "male", value: "male" },
                { label: "female", value: "female" },
                { label: "other", value: "other" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            提交
          </Button>
        </Form>
      </div>

      <div style={{ padding: "16px 0" }}>
        {/* <UserTable /> */}
        <BaseTable<UserType>
          options={{
            url: "/user/list",
            params,
            rowKey: "id",
            columns: [
              { title: "用户名", dataIndex: "username" },
              { title: "姓名", dataIndex: "nickname" },
              { title: "性别", dataIndex: "gender" },
            ],
          }}
        >
        </BaseTable>
      </div>
    </>
  );
};

export default User;
