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
  index?: boolean;

}

interface BaseTableProps<T extends object> {
  options: BaseTableOptions<T>;
}

function BaseTable<T extends object>({ options }: BaseTableProps<T>) {
  const {
    url,
    method = "post",
    params = {},
    columns,
    rowKey = "id",
    pagination = true,
    rowSelection = true,
    index = true,
  } = options;


  useEffect(() => {
    setPage(1);
    fetchData();
  }, [params]);

  
  const [tableData, setTableData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const internalRowSelection: TableProps<T>["rowSelection"] | undefined =
    rowSelection
      ? {
        type: "checkbox",
        selectedRowKeys: selectedKeys,
        onChange: (keys) => setSelectedKeys(keys),
      }
      : undefined;
  const internalColumns: TableColumnsType<T> = index
    ? [
      {
        title: "序号",
        render: (_, __, index) => {
          // 计算公式
          const sequence = (page - 1) * size + index + 1;
          return sequence;
        },
      },
      ...columns,
    ]
    : columns;

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
        setTableData(list);
        setTotal(totalRes);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const dealPageChange = (p: number, s: number) => {
    setPage(p);
    setSize(s);
  };

  return (
    <Table
      loading={loading}
      rowKey={rowKey}
      columns={internalColumns}
      dataSource={tableData}
      rowSelection={internalRowSelection}
      pagination={
        pagination
          ? {
            current: page,
            pageSize: size,
            total,
            onChange: dealPageChange,
          }
          : false
      }
    />
  );
}

export default BaseTable;
