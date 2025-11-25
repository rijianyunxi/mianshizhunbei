import { useEffect, useState } from "react";
import { Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import http from "@/utils/http";

export interface BaseTableOptions<T extends object> {
  url: string;
  method?: "get" | "post";
  params?: Record<string, any>;
  columns: TableColumnsType<T>;
  rowKey: string;
  pagination?: boolean;
  rowSelection?: boolean;
}

interface BaseTableProps<T extends object> {
  options: BaseTableOptions<T>;
}

export default function BaseTable<T extends object>({ options }: BaseTableProps<T>) {
  const {
    url,
    method = "post",
    params = {},
    columns,
    rowKey,
    pagination = true,
    rowSelection = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const fetchData = () => {
    setLoading(true);
    http({
      url,
      method,
      data: {
        page,
        size,
        ...params,
      },
    })
      .then((res) => {
        const list = res.data.list || res.data;
        const totalRes = res.data.total || list?.length || 0;

        setData(list);
        setTotal(totalRes);
      })
      .finally(() => {
        setLoading(false);
      });
  };


  useEffect(() => {
    fetchData();
  }, [page, size]);


  useEffect(() => {
    setPage(1);
    fetchData();
  }, [JSON.stringify(params)]); // 深比较

  const internalRowSelection: TableProps<T>["rowSelection"] | undefined =
    rowSelection
      ? {
          type: "checkbox",
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
        }
      : undefined;

  return (
    <Table
      loading={loading}
      rowKey={rowKey}
      columns={columns}
      dataSource={data}
      rowSelection={internalRowSelection}
      pagination={
        pagination
          ? {
              current: page,
              pageSize: size,
              total,
              onChange: (p, s) => {
                setPage(p);
                setSize(s);
              },
            }
          : false
      }
    />
  );
}
