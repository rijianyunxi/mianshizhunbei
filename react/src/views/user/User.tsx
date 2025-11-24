import type { FC } from "react";
import { Input, Form, Select, Button } from "antd";

import UserTable from "./UserTable";

type FieldType = {
  username?: string;
  password?: string;
  gender?: string;
};

const User: FC = () => {
  const [form] = Form.useForm();
  const onFinish = (values: FieldType) => {
    console.log(values);
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
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入..." />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="姓名"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入..." />
          </Form.Item>
          <Form.Item
            style={{ width: "240px" }}
            name="gender"
            label="性别"
            rules={[{ required: true, message: "请选择性别" }]}
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
        <UserTable />
      </div>
    </>
  );
};

export default User;
