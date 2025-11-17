import "./Child.css";

type PropsType = {
  count: number,
  setCount: (count: number) => void
}

function Child(props: PropsType) {
    const list = [1,2,3,4,5]
    const listItem = list.map((item) => (
        <li key={item}>{item}</li>
    ))
  return (
    <>
      <hr />
      <h1>Child</h1>
      <p onClick={()=>{props.setCount(props.count + 1)}}>count is {props.count}</p>
      <ul>
        {listItem}
      </ul>
    </>
  );
}

export default Child;
