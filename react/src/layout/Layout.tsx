import React from 'react';
import { Outlet } from 'react-router-dom';
import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Layout, Menu, } from 'antd';

const { Header, Content, Sider } = Layout;

const items = [UserOutlined, VideoCameraOutlined, UploadOutlined, UserOutlined].map(
    (icon, index) => ({
        key: String(index + 1),
        icon: React.createElement(icon),
        label: `nav ${index + 1}`,
    }),
);

const MainLayout: React.FC = () => {


    return (
        <Layout style={{
            height: "100vh"
        }}>
            <Header />
            <Layout>
                <Sider
                    breakpoint="lg"
                    collapsedWidth="0"
                >
                    <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={items} />
                </Sider>
                <Content style={{ margin: '16px', }}>
                    <div style={{background: "#f7f7f7"}}>
                        <Outlet></Outlet>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;