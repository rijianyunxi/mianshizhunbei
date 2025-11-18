import { useEffect,useContext } from "react";
import  type { FormEvent, ChangeEvent } from "react";
import   { useState } from "react";
import styles from "./login.module.scss";
// import { UserContext } from '@/App';


interface FormState {
  username: string;
  password: string;
}

export default function LoginPage() {
  // const context = useContext(UserContext);
  
  const [form, setForm] = useState<FormState>({ username: "", password: "" });


  useEffect(() => {
    console.log('Login useEffect 执行了...');

    return () => {
      console.log('Login useEffect return 执行了...');
    }
  }, [])
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert(`欢迎回来，${form.username || "用户"}！`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h2 className={styles.title}>登 录</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">密 码</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className={styles.loginBtn}>
            登 录
          </button>
        </form>

        <p className={styles.footer}>© 2025 v50.baby | 简洁之美</p>
      </div>
    </div>
  );
}
