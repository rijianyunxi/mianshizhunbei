import axios from "axios";
import type { AxiosResponse, AxiosError } from "axios";
import { message } from "antd";
const instance = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  () => {    
    return Promise.reject(new Error("请求失败"));
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      // 网络错误或请求未发出
      message.error("网络错误，请检查您的网络连接");
    } else {
      switch (error.response.status) {
        case 400:
          message.error("请求参数错误");
          break;
        case 401:
          message.error("未授权，请重新登录");
          break;
        case 403:
          message.error("没有权限访问该资源");
          break;
        case 404:
          message.error("请求资源不存在");
          break;
        case 408:
          message.error("请求超时");
          break;
        case 500:
          message.error("服务器内部错误，请稍后重试");
          break;
        case 502:
          message.error("网关错误");
          break;
        case 503:
          message.error("服务不可用，请稍后重试");
          break;
        case 504:
          message.error("网关超时");
          break;
        default:
          message.error("请求失败");
      }
    }
    return Promise.reject(error);
  }
);
type contentTypeType = "json" | "form" | "multipart";

const contentTypeMap: Record<contentTypeType, string> = {
  json: "application/json",
  form: "application/x-www-form-urlencoded",
  multipart: "multipart/form-data",
};

type HttppRequestparamsType = {
  url: string;
  data?: object;
  headers?: Record<string, string>;
  contentType?: contentTypeType;
  method?: "get" | "post";
};

function http(params: HttppRequestparamsType) {
  const { url, data, headers = {}, contentType, method } = params;
  return instance({
    method: method || "post",
    url,
    data: data || {},
    headers: {
      ...headers,
      "Content-Type": contentTypeMap[contentType || "form"],
    },
  }).then((res) => res.data);
}
export default http;
