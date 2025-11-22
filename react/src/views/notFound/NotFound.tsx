import { useNavigate } from "react-router-dom";
import styles from "./notFound.module.scss";
export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // 返回上一页
  };





  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>页面未找到</h2>
        <p className={styles.desc}>
          很抱歉，你访问的页面不存在或已被删除。
        </p>
        <button className={styles.backBtn} onClick={handleBack}>
          返回上一页
        </button>
      </div>
    </div>
  );
}
